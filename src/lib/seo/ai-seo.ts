import type {
  SeoAnalysisResult,
} from "./seo-analyzer";

export type AiSeoEntityType =
  | "site"
  | "product"
  | "category"
  | "promotion"
  | "flash-sale";

export type AiSeoRecommendationInput = {
  entityType: AiSeoEntityType;
  entityId?: string;

  name?: string | null;
  description?: string | null;
  slug?: string | null;

  currentMetadata: {
    title?: string | null;
    description?: string | null;
    canonicalUrl?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImage?: string | null;
  };

  analysis: SeoAnalysisResult;
};

export type AiSeoRecommendation = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;

  reasoning: string[];

  provider: string;
  model: string;
  generatedAt: string;
};

export interface AiSeoProvider {
  readonly name: string;
  readonly model: string;

  generateRecommendation(
    input: AiSeoRecommendationInput,
  ): Promise<AiSeoRecommendation>;
}