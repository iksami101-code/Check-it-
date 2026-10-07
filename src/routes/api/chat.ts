import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { streamText, convertToModelMessages } = await import("ai");
        const { createAiModel, reasoningOptions, aiErrorMessage } = await import("@/lib/ai/provider.server");
        const { getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } = await import(
          "@/lib/ai/run-id.server"
        );
        let body: { messages?: unknown };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
        if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 60) {
          return Response.json({ error: "Invalid messages" }, { status: 400 });
        }
        try {
          const { model, runIdFetch } = createAiModel(getLovableAiGatewayRunId(request));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const messages = await convertToModelMessages(body.messages as any);
          const result = streamText({
            model,
            system:
              "You are Check It AI's research assistant. Help people think critically: explain topics clearly, separate facts from opinions, mention uncertainty, and suggest reputable sources to verify. Be concise and use short paragraphs or bullet lists. Use markdown sparingly.",
            messages,
            abortSignal: request.signal,
            providerOptions: reasoningOptions,
          });
          return withLovableAiGatewayRunIdHeader(
            result.toUIMessageStreamResponse({
              onError: (e) => aiErrorMessage(e).message,
            }),
            runIdFetch,
          );
        } catch (e) {
          const { status, message } = aiErrorMessage(e);
          return Response.json({ error: message }, { status });
        }
      },
    },
  },
});
