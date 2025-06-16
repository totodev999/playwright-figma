import express from 'express';
import { generateDesign } from './main/generateDesign';
import { z } from 'zod';

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

    res.on('close', () => {
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

    const { id, html } = await index('GENERATE', data.message, data.messageId);
    res.setHeader('x-message-id', id).json({ html });
    return;
  });

  app.get('/api/design', async (req, res, next) => {
    res.json([{ role: 'assistant', html: [] }]);
    return;
  });

  app.all('/{*any}', (req, res, next) => {
    res.status(404).send('404');
    return;
  });

  const port = process.env.PORT || 3000;
  console.log(port);

  app.listen(port, () => {
    console.log(`start server port:${port}`);
  });
}
