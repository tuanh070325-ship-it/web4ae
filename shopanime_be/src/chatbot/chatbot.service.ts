import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';

export interface ChatbotRequestBody {
  message?: unknown;
  sessionId?: unknown;
  pageUrl?: unknown;
  user?: {
    id?: unknown;
    username?: unknown;
    email?: unknown;
  };
}

export interface ChatbotResponse {
  reply: string;
  suggestions: string[];
  handoff: boolean;
}

interface N8nResponseShape {
  reply?: unknown;
  output?: unknown;
  text?: unknown;
  message?: unknown;
  suggestions?: unknown;
  handoff?: unknown;
}

const DEFAULT_WEBHOOK_URL = 'https://n8n.arcanic.ai/webhook/akibacore';
const FALLBACK_REPLY = 'Sorry, AkibaCore support is temporarily unavailable. Please try again in a moment.';

function optionalString(value: unknown) {
  if (typeof value !== 'string') {return undefined;}
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function suggestionsFrom(value: unknown) {
  if (!Array.isArray(value)) {return [];}
  return value
    .map((item) => optionalString(item))
    .filter((item): item is string => Boolean(item))
    .slice(0, 4);
}

function parseN8nJson(value: unknown): N8nResponseShape {
  if (Array.isArray(value)) {
    return parseN8nJson(value[0]);
  }

  if (value && typeof value === 'object') {
    return value as N8nResponseShape;
  }

  if (typeof value === 'string') {
    return parseN8nString(value);
  }

  return {};
}

function parseN8nString(value: string): N8nResponseShape {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return {};
  }

  try {
    return parseN8nJson(JSON.parse(trimmedValue));
  } catch {
    return { reply: trimmedValue };
  }
}

function responseFromShape(shape: N8nResponseShape): ChatbotResponse {
  const nestedOutput = optionalString(shape.output) ? parseN8nString(String(shape.output)) : null;
  if (nestedOutput && (nestedOutput.reply || nestedOutput.output || nestedOutput.text || nestedOutput.message)) {
    return responseFromShape(nestedOutput);
  }

  const reply =
    optionalString(shape.reply) ||
    optionalString(shape.output) ||
    optionalString(shape.text) ||
    optionalString(shape.message) ||
    FALLBACK_REPLY;

  return {
    reply,
    suggestions: suggestionsFrom(shape.suggestions),
    handoff: Boolean(shape.handoff),
  };
}

@Injectable()
export class ChatbotService {
  async sendMessage(body: ChatbotRequestBody): Promise<ChatbotResponse> {
    const message = optionalString(body.message);
    if (!message) {
      throw new BadRequestException('Message is required');
    }
    if (message.length > 2000) {
      throw new BadRequestException('Message must be 2000 characters or fewer');
    }

    const webhookUrl = process.env.N8N_CHATBOT_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
    const timeoutMs = Math.max(1000, Number(process.env.N8N_CHATBOT_TIMEOUT_MS || 30000));
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'akibacore-web',
          message,
          sessionId: optionalString(body.sessionId),
          pageUrl: optionalString(body.pageUrl),
          userId: optionalNumber(body.user?.id),
          username: optionalString(body.user?.username),
          email: optionalString(body.user?.email),
          timestamp: new Date().toISOString(),
        }),
        signal: abortController.signal,
      });

      const rawBody = await response.text();
      if (!response.ok) {
        throw new ServiceUnavailableException('Chatbot service returned an error');
      }

      return this.normalizeResponse(rawBody);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(FALLBACK_REPLY);
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeResponse(rawBody: string): ChatbotResponse {
    const trimmedBody = rawBody.trim();
    if (!trimmedBody) {
      return { reply: FALLBACK_REPLY, suggestions: [], handoff: true };
    }

    let parsed: N8nResponseShape;
    try {
      parsed = parseN8nJson(JSON.parse(trimmedBody));
    } catch {
      parsed = parseN8nString(trimmedBody);
    }

    return responseFromShape(parsed);
  }
}
