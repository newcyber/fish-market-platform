import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod/v4";

import type {
  AiSeoProvider,
  AiSeoRecommendation,
  AiSeoRecommendationInput,
} from "../ai-seo";

const openai = new OpenAI();

const DEFAULT_MODEL = "gpt-5.6-luna";

const SeoRecommendationSchema = z.object({
  title: z
    .string()
    .nullable()
    .describe(
      "Recommended SEO title, or null if no title recommendation is needed.",
    ),

  description: z
    .string()
    .nullable()
    .describe(
      "Recommended SEO meta description, or null if no description recommendation is needed.",
    ),

  ogTitle: z
    .string()
    .nullable()
    .describe(
      "Recommended Open Graph title, or null if no recommendation is needed.",
    ),

  ogDescription: z
    .string()
    .nullable()
    .describe(
      "Recommended Open Graph description, or null if no recommendation is needed.",
    ),

  reasoning: z
    .array(z.string())
    .describe(
      "Short factual reasons explaining why the recommendations improve SEO.",
    ),
});

type SeoRecommendationOutput =
  z.infer<typeof SeoRecommendationSchema>;

function getModel(): string {
  return (
    process.env.OPENAI_SEO_MODEL?.trim() ||
    DEFAULT_MODEL
  );
}

function buildInput(
  input: AiSeoRecommendationInput,
): string {
  return JSON.stringify({
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    name: input.name ?? null,
    description: input.description ?? null,
    slug: input.slug ?? null,
    currentMetadata: input.currentMetadata,
    analysis: input.analysis,
  });
}

export class OpenAiSeoProvider
  implements AiSeoProvider
{
  readonly name = "openai";

  readonly model = getModel();

  async generateRecommendation(
    input: AiSeoRecommendationInput,
  ): Promise<AiSeoRecommendation> {
    const response =
      await openai.responses.parse({
        model: this.model,

        instructions: `
You are the SEO recommendation assistant
for Pisjo Market.

Analyze the supplied product SEO context and
provide practical SEO metadata recommendations.

Rules:

- Recommendations must be based only on information
  supplied in the input.
- Never invent product facts.
- Never invent ingredients.
- Never invent nutrition information.
- Never invent storage instructions.
- Never invent certifications.
- Never invent prices, sizes, weights, origins,
  or product specifications.
- Preserve the factual meaning of the existing
  product information.
- Prefer natural Indonesian language.
- Keep SEO titles concise and suitable for search
  engine results.
- Keep meta descriptions concise and suitable for
  search engine results.
- If the available information is insufficient for
  a safe recommendation, return null for that field.
- Recommendations are suggestions only.
- Never request or perform a production data update.
        `.trim(),

        input: buildInput(input),

        text: {
          format: zodTextFormat(
            SeoRecommendationSchema,
            "seo_recommendation",
          ),
        },
      });

    if (!response.output_parsed) {
      throw new Error(
        "AI SEO provider tidak menghasilkan recommendation yang valid.",
      );
    }

    const parsed: SeoRecommendationOutput =
      response.output_parsed;

    return {
      title: parsed.title ?? undefined,
      description:
        parsed.description ?? undefined,
      ogTitle:
        parsed.ogTitle ?? undefined,
      ogDescription:
        parsed.ogDescription ?? undefined,
      reasoning: parsed.reasoning,
      provider: this.name,
      model: this.model,
      generatedAt:
        new Date().toISOString(),
    };
  }
}