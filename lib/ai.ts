import { createGroq } from "@ai-sdk/groq";

export const GROQ_MODEL = "openai/gpt-oss-120b";

export function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local (local) or Netlify env vars (deploy)."
    );
  }
  return createGroq({ apiKey });
}
