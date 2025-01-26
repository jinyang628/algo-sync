import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import { z } from 'zod';

import { InferenceConfig } from '@/types/config';

export const modelTypeEnum = z.enum(['openai']);

export type ModelType = z.infer<typeof modelTypeEnum>;

export const role = z.enum(['system', 'user', 'assistant']);
export type Role = z.infer<typeof role>;

export const llmMessageSchema = z.object({
  role: role,
  content: z.string(),
});
export type LLMMessage = z.infer<typeof llmMessageSchema>;

type InferProps<T extends z.ZodType> = {
  messages: LLMMessage[];
  responseFormat: T;
};

export type BaseLLMClient = {
  temperature: number;
  modelName: string;
  infer<T extends z.ZodType>({ messages, responseFormat }: InferProps<T>): Promise<z.infer<T>>;
};

export class Constructor {
  static create(config: InferenceConfig, apiKey: string): BaseLLMClient {
    switch (config.modelType) {
      case modelTypeEnum.Values.openai:
        return new OpenAIClient(config, apiKey);
      default:
        throw new Error('Invalid LLM client');
    }
  }
}

export class OpenAIClient implements BaseLLMClient {
  temperature: number;
  modelName: string;
  client: OpenAI;

  constructor(config: InferenceConfig, apiKey: string) {
    this.temperature = config.temperature;
    this.modelName = config.modelName;
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async infer<T extends z.ZodType>({
    messages,
    responseFormat,
  }: InferProps<T>): Promise<z.infer<T>> {
    try {
      const response = await this.client.beta.chat.completions.parse({
        model: this.modelName,
        messages: messages,
        temperature: this.temperature,
        response_format: zodResponseFormat(responseFormat, 'result'),
      });
      const result = response.choices[0].message.parsed;
      if (!result) {
        throw new Error('No content found in response');
      }
      return result;
    } catch (error: unknown) {
      console.error(error);
      throw error;
    }
  }
}
