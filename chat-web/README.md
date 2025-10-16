## Agentic Chat

Agentic Chat is a Next.js application that delivers a ChatGPT-style experience with streaming responses from OpenAI models. The interface is optimized for desktop and mobile, supports multi-turn conversation history, and gracefully handles API errors.

### Features

- Real-time streaming responses for a fluid chat experience.
- Persistent conversation state within the current session.
- Tailwind-powered dark theme inspired by modern AI tooling.
- Graceful error handling with actionable feedback.

### Prerequisites

- Node.js 18.17+ or 20+ (matches the Next.js requirement).
- An OpenAI API key with access to the desired models.

### Environment

Create a `.env.local` file at the project root and add:

```bash
OPENAI_API_KEY=sk-your-key
# Optional overrides
# OPENAI_MODEL=gpt-4o-mini
# OPENAI_TEMPERATURE=0.6
```

### Development

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the chat interface.

### Production Build

```bash
npm run build
npm start
```

### Deployment

The project is optimized for Vercel. Ensure the `OPENAI_API_KEY` (and optional overrides) are configured as environment variables in the Vercel dashboard or via the CLI before deploying.

---

This project was bootstrapped with `create-next-app` using the App Router, TypeScript, and Tailwind CSS.
