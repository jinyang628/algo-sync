import { getInferenceClient } from '@/utils/inference/client';

import { InferenceConfig } from '@/types/config';
import { EmailMessage } from '@/types/email';
import { ExtractTimeslotResponse, extractTimeslotResponseSchema } from '@/types/extract';
import { role } from '@/types/inference';

const SYSTEM_PROMPT = `Extract the start and end datetime of the interview in the email.`;

type ExtractTimeslotProps = {
  messages: EmailMessage[];
  inferenceConfig: InferenceConfig;
};

export default async function extractTimeslot({
  messages,
  inferenceConfig,
}: ExtractTimeslotProps): Promise<ExtractTimeslotResponse> {
  const client = await getInferenceClient(inferenceConfig);
  const response = await client.infer({
    messages: [
      {
        role: role.Values.system,
        content: SYSTEM_PROMPT,
      },
      {
        role: role.Values.user,
        content: messages
          .map((msg) => `From: ${msg.name} <${msg.email}>\n${msg.content}`)
          .join('\n'),
      },
    ],
    responseFormat: extractTimeslotResponseSchema,
  });
  return extractTimeslotResponseSchema.parse(response);
}
