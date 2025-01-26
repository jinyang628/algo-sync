import { InferenceConfig } from '@/types/config';
import { BaseLLMClient, Constructor, modelTypeEnum } from '@/types/inference';

export async function getInferenceClient(inferenceConfig: InferenceConfig): Promise<BaseLLMClient> {
  let apiKey: string = '';

  switch (inferenceConfig.modelType) {
    case modelTypeEnum.Values.openai:
      try {
        apiKey = await browser.storage.sync.get('openAiKey').then((result) => result.openAiKey);
      } catch (error) {
        console.error('Error getting API key from storage:', error);
      }

      if (!apiKey) {
        throw new Error('No OpenAI API key found');
      }

      return Constructor.create(inferenceConfig, apiKey);
    default:
      throw new Error(
        `LLM client not supported. Expected one of ${modelTypeEnum.Values}. Got ${inferenceConfig.modelType}`,
      );
  }
}

// export async function infer
