import dotenv from 'dotenv';
import { Pool } from 'pg';
import { CoreMessage } from 'ai';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  connectionTimeoutMillis: 3000,
  max: 10,
});

type ChatHistory = {
  id: string;
  messages: any[];
};

export const getConversation = async (id: string) => {
  const client = await pool.connect();
  try {
    const result = (
      await client.query<ChatHistory>('SELECT * FROM messages where id = $1;', [
        id,
      ])
    ).rows?.[0];
    console.log('getConversation', result);
    return result ? result : undefined;
  } catch (err) {
    console.error('Fetch DB failed', err);
    throw err;
  } finally {
    client.release();
  }
};

export const getConversations = async () => {
  const client = await pool.connect();
  try {
    const result = (await client.query<ChatHistory>('SELECT * FROM messages;'))
      .rows;
    console.log('getConversations', result);
    return result;
  } catch (err) {
    console.error('Fetch DB failed', err);
    throw err;
  } finally {
    client.release();
  }
};

export const upsertConversation = async (
  id: string | undefined,
  messages: any[]
): Promise<string> => {
  const client = await pool.connect();
  try {
    if (id) {
      const result = (
        await client.query<never>(
          'UPDATE messages set messages = $1 where id = $2;',
          [JSON.stringify(messages), id]
        )
      ).rows[0];
      console.log('upsertConversation UPDATE', id);
      return id;
    } else {
      const result = (
        await client.query<{ id: string }>(
          'INSERT INTO messages (messages) VALUES($1) returning id;',
          [JSON.stringify(messages)]
        )
      ).rows[0];
      console.log('upsertConversation INSERT', id);
      return result.id;
    }
  } catch (err) {
    console.error('Fetch DB failed', err);
    throw err;
  } finally {
    client.release();
  }
};
