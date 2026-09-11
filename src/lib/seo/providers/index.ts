import type {
  AiSeoProvider,
} from "../ai-seo";

import {
  OpenAiSeoProvider,
} from "./openai.provider";

let provider:
  | AiSeoProvider
  | null
  | undefined;

export function getAiSeoProvider():
  | AiSeoProvider
  | null {
  if (provider !== undefined) {
    return provider;
  }

  const apiKey =
    process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    provider = null;
    return provider;
  }

  provider =
    new OpenAiSeoProvider();

  return provider;
}