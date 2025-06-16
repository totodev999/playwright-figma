import express from 'express';
import type { ErrorRequestHandler } from 'express';
import { generateDesign } from './main/generateDesign';
import { z } from 'zod';
import { getConversation, getConversations } from './libs/db/db';

type Event = 'HTML' | 'GENERATE';

const createDesignSchema = z.object({
  messageId: z.string().uuid().optional(),
  message: z.string(),
});

export default async function index(
  event: Event,
  message: string,
  messageId: string | undefined
) {
  switch (event) {
    case 'GENERATE':
      return await generateDesign(message, messageId);
    default:
      throw new Error(`Hey, check your request ${event}`);
  }
}

if (process.argv[2] === 'server') {
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    console.log(
      'request start',
      new Date().toLocaleString(),
      req.headers['x-message-id']
    );

    res.on('finish', () => {
      console.log(
        'request ends',
        new Date().toLocaleString(),
        req.headers['x-message-id']
      );
    });
    next();
  });

  app.post('/api/design', async (req, res, next) => {
    const messageId = req.headers['x-message-id'] as string | undefined;
    const { message }: { message: string } = req.body;

    const data = createDesignSchema.parse({ messageId, message });

    try {
      const { id, html } = await index(
        'GENERATE',
        data.message,
        data.messageId
      );
      res.setHeader('x-message-id', id).json({ html });
      return;
    } catch (err) {
      throw err;
    }
  });

  app.get('/api/design', async (req, res, next) => {
    try {
      const conversations = await getConversations();
      const transformed = conversations.map((conversation) => ({
        id: conversation.id,
        message: conversation.messages.find((msg) => msg.role === 'user'),
      }));
      res.json(transformed);
      return;
    } catch (err) {
      throw err;
    }
  });

  app.get('/api/design/:id', async (req, res, next) => {
    const { id } = req.params;

    try {
      const conversation = await getConversation(id);

      if (!conversation) {
        res.status(404).send('not found');
        return;
      }

      const filtered = conversation.messages.filter(
        (msg) => msg.role === 'user' || msg.role === 'assistant'
      );
      res.json({ id: conversation.id, messages: filtered });
      return;
    } catch (err) {
      throw err;
    }
  });

  app.all('/{*any}', (req, res, next) => {
    res.status(404).send('404');
    return;
  });

  const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error(err);
    res.status(500).send('Something broke!');
    return;
  };
  app.use(errorHandler);

  const port = process.env.PORT || 3000;
  console.log(port);

  app.listen(port, () => {
    console.log(`start server port:${port}`);
  });
}
