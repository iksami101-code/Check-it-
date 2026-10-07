# Deploy Check It AI to Cloudflare

This app has a server part (for the AI), so it deploys as a **Cloudflare Worker with static assets**
(not a plain drag-and-drop Pages upload). The `dist/` folder is already built.

## 1. Deploy
```bash
npm install -g wrangler        # once
wrangler login                 # once
wrangler deploy                # uses wrangler.jsonc, deploys dist/
```

## 2. Add your AI key (required for the AI to work)
Get an API key from https://platform.openai.com/api-keys, then:
```bash
wrangler secret put AI_API_KEY          # paste your OpenAI key
wrangler secret put AI_BASE_URL         # enter: https://api.openai.com/v1
wrangler secret put AI_MODEL            # enter: gpt-5   (or another OpenAI model)
```

## 3. Sign-in
- Email/password sign-in works on Cloudflare.
- "Continue with Google" only works on the Lovable-hosted version (it uses Lovable's sign-in service).
- Add your Cloudflare URL to the allowed redirect URLs in your Lovable Cloud auth settings so email confirmation links return to it.

## Rebuilding from source
```bash
npm install
npm run build
wrangler deploy
```
The database (checks, history, insights) is shared with the Lovable-hosted version.
