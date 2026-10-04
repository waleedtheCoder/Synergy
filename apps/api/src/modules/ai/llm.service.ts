import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type { z } from 'zod';

export const CLAUDE_MODEL = 'claude-opus-5-5';

// Server-side refusal fallback: if the model declines on a safety
// classifier, the API transparently retries on a suitable fallback model.
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

type Effort = 'low' | 'medium' | 'high';

interface GenerateOptions {
  system: string;
  prompt: string;
  /** low for quick Q&A, medium for anything that needs real judgment. */
  effort: Effort;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: Anthropic | null;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
    if (!this.client) {
      this.logger.warn(
        'ANTHROPIC_API_KEY not set — AI answer generation is disabled',
      );
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  private requireClient(): Anthropic {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'AI features are not configured on this server',
      );
    }
    return this.client;
  }

  async generateText(options: GenerateOptions): Promise<string> {
    const client = this.requireClient();
    const response = await this.call(() =>
      client.beta.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 16000,
        betas: [FALLBACK_BETA],
        fallbacks: 'default',
        system: options.system,
        output_config: { effort: options.effort },
        messages: [{ role: 'user', content: options.prompt }],
      }),
    );

    this.assertNotRefused(response.stop_reason);
    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();
    if (!text) {
      throw new BadGatewayException('The AI assistant returned no answer');
    }
    return text;
  }

  async generateStructured<Schema extends z.ZodType>(
    schema: Schema,
    options: GenerateOptions,
  ): Promise<z.infer<Schema>> {
    const client = this.requireClient();
    const response = await this.call(() =>
      client.beta.messages.parse({
        model: CLAUDE_MODEL,
        max_tokens: 16000,
        betas: [FALLBACK_BETA],
        fallbacks: 'default',
        system: options.system,
        output_config: {
          effort: options.effort,
          format: betaZodOutputFormat(schema),
        },
        messages: [{ role: 'user', content: options.prompt }],
      }),
    );

    this.assertNotRefused(response.stop_reason);
    if (response.parsed_output == null) {
      this.logger.warn(
        `Structured output failed to parse (stop_reason=${response.stop_reason})`,
      );
      throw new BadGatewayException(
        'The AI assistant returned an unreadable answer',
      );
    }
    return response.parsed_output;
  }

  private assertNotRefused(stopReason: string | null) {
    if (stopReason === 'refusal') {
      throw new UnprocessableEntityException(
        "The AI assistant can't help with this request",
      );
    }
  }

  private async call<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) {
        this.logger.error('Anthropic API key was rejected');
        throw new ServiceUnavailableException(
          'AI features are misconfigured on this server',
        );
      }
      if (error instanceof Anthropic.RateLimitError) {
        throw new ServiceUnavailableException(
          'The AI assistant is busy — please try again shortly',
        );
      }
      if (error instanceof Anthropic.APIError) {
        this.logger.error(
          `Anthropic API error ${String(error.status)}: ${error.message}`,
        );
        throw new BadGatewayException('The AI assistant is unavailable');
      }
      throw error;
    }
  }
}
