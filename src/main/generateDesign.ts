import { CoreMessage, generateObject } from 'ai';
import {
  createGoogleGenerativeAI,
  GoogleGenerativeAIProviderOptions,
} from '@ai-sdk/google';
import dotenv from 'dotenv';
import { z } from 'zod';
import { systemPrompt } from '../libs/prompt/prompt';
import { getConversation, upsertConversation } from '../libs/db/db';

dotenv.config({});

const modelName = process.env.MODEL_NAME;
const apiKey = process.env.API_KEY;

if (!modelName || !apiKey) {
  throw new Error('check env');
}

const schema = z.object({
  html: z
    .array(z.string().describe('HTML and CSS'))
    .describe(
      "If you think it's better to create multiple screens, then do so."
    ),
  explanation: z.string().describe('The explanation of your design'),
});

const google = createGoogleGenerativeAI({ apiKey });

export const generateDesign = async (
  message: string,
  messageId: string | undefined
) => {
  let messages: CoreMessage[] = [];

  const messageHistory = messageId
    ? await getConversation(messageId)
    : undefined;

  if (messageHistory) {
    messages.push(...messageHistory.messages);
  }

  if (!messages.length) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: message });

  const { object } = await generateObject({
    model: google(modelName),
    schema,
    messages,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 0,
        },
      } satisfies GoogleGenerativeAIProviderOptions,
    },
  });

  console.log(object.html);

  const id = await upsertConversation(messageHistory?.id, [
    ...messages,
    { role: 'assistant', content: JSON.stringify(object) },
  ]);

  return { id, html: object.html };
};
