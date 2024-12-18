// Remove unused import and add type for API response
interface AnthropicStreamOptions {
  prompt: string;
  max_tokens_to_sample: number;
  model: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
}

interface AnthropicResponse {
  completion: string;
}

import { createScopedLogger } from './logger';

const logger = createScopedLogger('Anthropic');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function makeAnthropicRequest(
  options: AnthropicStreamOptions,
  apiKey: string,
  retryCount = 0,
): Promise<Response> {
  const response = await fetch('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      prompt: `\n\nHuman: ${options.prompt}\n\nAssistant:`,
      model: options.model,
      max_tokens_to_sample: options.max_tokens_to_sample,
      temperature: options.temperature ?? 0,
      top_p: options.top_p,
      top_k: options.top_k,
    }),
  });

  if (response.status === 429 || response.status === 529) {
    if (retryCount < 3) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '5'),
        waitTime = retryAfter * 1000 || Math.min(1000 * Math.pow(2, retryCount), 8000);

      logger.debug(`Rate limited (${response.status}). Retrying after ${waitTime}ms...`);
      await sleep(waitTime);

      return makeAnthropicRequest(options, apiKey, retryCount + 1);
    }
  }

  return response;
}

export async function anthropicStream(options: AnthropicStreamOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    logger.error('ANTHROPIC_API_KEY environment variable is not set');
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  logger.debug('Making API call to Anthropic...', {
    model: options.model,
    maxTokens: options.max_tokens_to_sample,
  });

  try {
    const response = await makeAnthropicRequest(options, apiKey);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        prompt: options.prompt.substring(0, 100) + '...'
      });

      if (response.status === 429 || response.status === 529) {
        throw new Error('Anthropic API is currently overloaded. Please try again in a few moments.');
      }

      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your ANTHROPIC_API_KEY environment variable.');
      }

      throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as AnthropicResponse;
    logger.debug('API Response received', {
      status: response.status,
      hasCompletion: !!data.completion,
    });

    return data.completion;
  } catch (error) {
    logger.error('API error:', error);
    logger.error('Request details:', {
      model: options.model,
      maxTokens: options.max_tokens_to_sample,
      apiKeyPresent: !!apiKey,
    });
    throw error;
  }
}
