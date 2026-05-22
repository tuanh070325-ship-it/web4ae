import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  PRODUCT_DESCRIPTION_GENERATE_PROMPT,
  PRODUCT_DESCRIPTION_REVISE_PROMPT,
} from './product-description-prompts.js';

interface ProductAiContext {
  name?: unknown;
  category?: unknown;
  author?: unknown;
  price?: unknown;
}

export interface ProductAiGenerateBody {
  instruction?: unknown;
  product?: ProductAiContext;
}

export interface ProductAiReviseBody {
  description?: unknown;
  instruction?: unknown;
  product?: ProductAiContext;
}

interface ProductAiResponse {
  description: string;
  source: 'gemini';
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface GeminiErrorResponse {
  error?: {
    message?: string;
    status?: string;
  };
}

const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const MIN_DESCRIPTION_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 700;
const MAX_LENGTH_RETRY_COUNT = 3;
const GEMINI_MODEL_ALIASES: Record<string, string> = {
  'gemini-3.1-flash': 'gemini-3-flash-preview',
};

function optionalString(value: unknown) {
  if (typeof value !== 'string') {return undefined;}
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {return undefined;}
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function requiredText(value: unknown, fieldName: string, maxLength: number) {
  const text = optionalString(value);
  if (!text) {
    throw new BadRequestException(`${fieldName} is required`);
  }
  if (text.length > maxLength) {
    throw new BadRequestException(`${fieldName} must be ${maxLength} characters or fewer`);
  }
  return text;
}

function productContext(product: ProductAiContext | undefined) {
  return {
    name: optionalString(product?.name),
    category: optionalString(product?.category),
    author: optionalString(product?.author),
    price: optionalNumber(product?.price),
  };
}

function descriptionFromJson(value: unknown) {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const candidate = value as { description?: unknown };
  return optionalString(candidate.description);
}

function parseDescriptionOutput(rawText: string) {
  const cleanedText = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleanedText);
    const jsonDescription = descriptionFromJson(parsed);
    if (jsonDescription) {
      return jsonDescription;
    }
  } catch {
    // Fall through to plain text fallback.
  }

  return cleanedText;
}

function normalizeDescription(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MAX_DESCRIPTION_LENGTH) {
    return normalized;
  }

  const sliced = normalized.slice(0, MAX_DESCRIPTION_LENGTH);
  const lastSentenceEnd = Math.max(
    sliced.lastIndexOf('.'),
    sliced.lastIndexOf('!'),
    sliced.lastIndexOf('?'),
  );

  if (lastSentenceEnd >= Math.floor(MAX_DESCRIPTION_LENGTH * 0.6)) {
    return sliced.slice(0, lastSentenceEnd + 1).trim();
  }

  return sliced.replace(/\s+\S*$/, '').trim();
}

function isDescriptionLengthValid(value: string) {
  return value.length >= MIN_DESCRIPTION_LENGTH && value.length <= MAX_DESCRIPTION_LENGTH;
}

function clampDescription(value: string) {
  return normalizeDescription(value);
}

function expandShortDescription(value: string) {
  const safeAdditions = [
    ' Phần mô tả được mở rộng như một lời mời bước vào thế giới của tác phẩm, nơi hành trình, thử thách và lựa chọn của nhân vật tạo nên sức hút riêng cho người đọc.',
    ' Nội dung hướng đến cảm giác khám phá, giúp khách hàng hình dung rõ hơn màu sắc câu chuyện và lý do sản phẩm phù hợp với bộ sưu tập manga/anime.',
    ' Đây là lựa chọn đáng cân nhắc cho độc giả yêu thích những câu chuyện có nhịp dẫn rõ ràng, cảm xúc vừa đủ và giá trị giải trí dễ tiếp cận.',
  ];

  let expanded = value;
  for (const addition of safeAdditions) {
    if (expanded.length >= MIN_DESCRIPTION_LENGTH) {
      break;
    }
    expanded += addition;
  }

  return clampDescription(expanded);
}

function descriptionLengthRules() {
  return {
    minCharacters: MIN_DESCRIPTION_LENGTH,
    maxCharacters: MAX_DESCRIPTION_LENGTH,
    unit: 'characters_not_words',
    instruction: `The final Vietnamese description must be between ${MIN_DESCRIPTION_LENGTH} and ${MAX_DESCRIPTION_LENGTH} characters, not words.`,
  };
}

function buildLengthRetryPrompt(input: {
  originalPrompt: string;
  invalidDescription: string;
}) {
  return JSON.stringify({
    task: 'rewrite_product_description_to_required_length',
    lengthRules: descriptionLengthRules(),
    requirement: `Rewrite the description in Vietnamese as a complete story-style ecommerce product description. It must be at least ${MIN_DESCRIPTION_LENGTH} characters and at most ${MAX_DESCRIPTION_LENGTH} characters.`,
    original_request: input.originalPrompt,
    invalid_description: input.invalidDescription,
    invalid_description_length: input.invalidDescription.length,
  });
}

function geminiErrorMessage(value: unknown) {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const payload = value as GeminiErrorResponse;
  return optionalString(payload.error?.message) || optionalString(payload.error?.status);
}

function normalizeGeminiModel(value: string) {
  const model = value.trim();
  return GEMINI_MODEL_ALIASES[model] || model;
}

function parseGeminiErrorBody(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  try {
    return geminiErrorMessage(JSON.parse(trimmedValue)) || trimmedValue;
  } catch {
    return trimmedValue;
  }
}

@Injectable()
export class ProductAiService {
  async generateDescription(body: ProductAiGenerateBody): Promise<ProductAiResponse> {
    const instruction = requiredText(body.instruction, 'Instruction', 1000);
    const description = await this.callGemini({
      systemPrompt: PRODUCT_DESCRIPTION_GENERATE_PROMPT,
      userPrompt: JSON.stringify({
        task: 'generate_product_description',
        lengthRules: descriptionLengthRules(),
        instruction,
        product: productContext(body.product),
      }),
      temperature: 0.7,
    });

    return { description, source: 'gemini' };
  }

  async reviseDescription(body: ProductAiReviseBody): Promise<ProductAiResponse> {
    const description = requiredText(body.description, 'Description', 1000);
    const instruction = requiredText(body.instruction, 'Instruction', 1000);
    const revisedDescription = await this.callGemini({
      systemPrompt: PRODUCT_DESCRIPTION_REVISE_PROMPT,
      userPrompt: JSON.stringify({
        task: 'revise_product_description',
        lengthRules: descriptionLengthRules(),
        instruction,
        current_description: description,
        product: productContext(body.product),
      }),
      temperature: 0.4,
    });

    return { description: revisedDescription, source: 'gemini' };
  }

  private async callGemini(input: {
    systemPrompt: string;
    userPrompt: string;
    temperature: number;
    lengthRetryCount?: number;
  }): Promise<string> {
    const apiKey = process.env.KEY_GEMINI || process.env.key_gemini;
    if (!apiKey) {
      throw new ServiceUnavailableException('Gemini API key is not configured');
    }

    const model = normalizeGeminiModel(process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL);
    const maxOutputTokens = Math.max(1, Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 5000));
    const timeoutMs = Math.max(1000, Number(process.env.GEMINI_TIMEOUT_MS || 30000));
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetch(`${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: input.systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: input.userPrompt }],
            },
          ],
          generationConfig: {
            temperature: input.temperature,
            maxOutputTokens,
            responseMimeType: 'application/json',
          },
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const upstreamMessage = parseGeminiErrorBody(await response.text());

        throw new ServiceUnavailableException(
          upstreamMessage
            ? `Gemini service returned an error for model "${model}": ${upstreamMessage}`
            : `Gemini service returned an error: HTTP ${response.status}`,
        );
      }

      const payload = (await response.json()) as GeminiResponse;
      const text = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim();

      if (!text) {
        throw new ServiceUnavailableException('Gemini returned an empty response');
      }

      const description = normalizeDescription(parseDescriptionOutput(text));
      if (!description) {
        throw new ServiceUnavailableException('Gemini returned an invalid description');
      }

      if (isDescriptionLengthValid(description)) {
        return description;
      }

      const lengthRetryCount = input.lengthRetryCount || 0;
      if (lengthRetryCount < MAX_LENGTH_RETRY_COUNT) {
        return this.callGemini({
          ...input,
          lengthRetryCount: lengthRetryCount + 1,
          userPrompt: buildLengthRetryPrompt({
            originalPrompt: input.userPrompt,
            invalidDescription: description,
          }),
        });
      }

      if (description.length < MIN_DESCRIPTION_LENGTH) {
        const expandedDescription = expandShortDescription(description);
        if (isDescriptionLengthValid(expandedDescription)) {
          return expandedDescription;
        }
      }

      throw new ServiceUnavailableException(
        `Gemini returned a description outside the required ${MIN_DESCRIPTION_LENGTH}-${MAX_DESCRIPTION_LENGTH} character range`,
      );
    } catch (error) {
      if (error instanceof ServiceUnavailableException || error instanceof BadRequestException) {
        throw error;
      }
      throw new ServiceUnavailableException('Unable to generate product description');
    } finally {
      clearTimeout(timeout);
    }
  }
}
