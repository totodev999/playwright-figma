import { useEffect, useRef, useState } from 'react';
import { Layout } from './coponents/Layout';
import { DesignModal } from './coponents/DesingnModal';
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router';

export type UserMessage = {
  role: 'user';
  content: string;
};
type AssistantMessage = {
  role: 'assistant';
  content: {
    html: string[];
  };
};
type Message = UserMessage | AssistantMessage;

const initialState = {
  message: '',
  messages: [] as Message[],
  open: false,
  html: '',
  messageIndex: 0,
  htmlIndex: 0,
};

export const App = () => {
  const { id } = useParams();
  const initialId = useRef(id);

  console.log('initialId', initialId);

  useEffect(() => {
    setState(initialState);
  }, [id]);

  const navigate = useNavigate();

  const [state, setState] = useState(initialState);

  const { message, messages, open, html, messageIndex, htmlIndex } = state;

  console.log('state', state);

  const { isLoading, error } = useQuery({
    queryKey: ['chat', id],
    queryFn: async () => {
      const res = await axios.get(`/api/design/${id}`);
      setState((prev) => ({ ...prev, messages: res.data.messages }));
      console.log('res.data', res.data);
      return res.data;
    },
    enabled: !!id,
  });

  const postMessage = useMutation({
    mutationFn: async (message: string) => {
      const res = await axios.post<{ html: string[] }>(
        '/api/design',
        { message },
        { headers: { 'x-message-id': id } }
      );
      return {
        data: {
          role: 'assistant',
          content: { html: res.data.html },
        } as AssistantMessage,
        id: res.headers['x-message-id'],
      };
    },
    onSuccess: (result) => {
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, result.data],
      }));
      if (!id) navigate(`/chat/${result.id}`, { replace: true });
    },
  });

  const changeHtml = (num: number) => {
    setState((prev) => {
      const targetMessage = prev.messages[prev.messageIndex];
      if (!targetMessage || targetMessage.role !== 'assistant') return prev;
      const htmlArr = targetMessage.content.html;
      let newIndex = prev.htmlIndex + num;
      if (newIndex < 0) newIndex = htmlArr.length - 1;
      if (newIndex >= htmlArr.length) newIndex = 0;
      return {
        ...prev,
        htmlIndex: newIndex,
        html: htmlArr[newIndex],
      };
    });
  };

  const handleSeeResult = (index: number, message: Message) => {
    if (message.role === 'assistant') {
      setState((prev) => ({
        ...prev,
        messageIndex: index,
        htmlIndex: 0,
        html: message.content.html[0] ?? '',
        open: true,
      }));
    }
  };

  const handleSend = () => {
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: message }],
      message: '',
    }));
    postMessage.mutate(message);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState((prev) => ({
      ...prev,
      message: e.target.value,
    }));
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen px-3">
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          <div className="ml-auto bg-blue-300 w-fit max-w-10/12 rounded-lg p-2 shadow">
            I'm your assistant. I'll create a sample design to help you be
            inspired.
          </div>
          {messages.map((message, index) => {
            return message.role === 'user' ? (
              <div
                key={message.content}
                className="self-start bg-white w-fit max-w-10/12 rounded-lg p-2 shadow"
              >
                {message.content as string}
              </div>
            ) : (
              <div
                key={JSON.stringify(message.content)}
                className="ml-auto bg-blue-300 w-fit max-w-10/12 rounded-lg p-2 shadow"
              >
                <button
                  className="bg-teal-400 p-3 rounded-2xl"
                  onClick={() => handleSeeResult(index, message)}
                >
                  see result
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mb-3">
          <textarea
            className="w-full border-2 border-gray-500 rounded-2xl p-6"
            rows={5}
            value={message}
            onChange={(e) => handleMessageChange(e)}
          ></textarea>
          <button
            onClick={handleSend}
            disabled={postMessage.isPending || message.length < 3}
            className="w-18 border border-blue-500 rounded-2xl h-16 mt-auto disabled:bg-gray-500 border-gray-500"
          >
            送信
          </button>
        </div>
      </div>
      <DesignModal
        isOpen={open}
        closeModal={() => setState((prev) => ({ ...prev, open: false }))}
        html={html}
        changeHtml={changeHtml}
      />

      {/* loading */}
      {postMessage.isPending && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-400 z-100 opacity-35">
          <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-primary-500"></div>
        </div>
      )}
    </Layout>
  );
};
