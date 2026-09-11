import type {
  AiSeoRecommendation,
  AiSeoRecommendationInput,
} from "./ai-seo";

import { getAiSeoProvider } from "./providers";

import {
  AiSeoProviderNotConfiguredError,
} from "./providers/errors";

export async function generateAiSeoRecommendation(
  input: AiSeoRecommendationInput,
): Promise<AiSeoRecommendation> {
  const provider =
    getAiSeoProvider();

  if (!provider) {
    throw new AiSeoProviderNotConfiguredError();
  }

  return provider.generateRecommendation(
    input,
  );
}