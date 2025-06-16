import { useRef, useState } from 'react';
import { Layout } from './coponents/Layout';
import { DesignModal } from './coponents/DesingnModal';
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router';

type assistantMessage = {
  role: string;
  content: {
    html: string[];
  };
};

export const App = () => {
  const { id } = useParams();
  const initialId = useRef(id);

  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<
    { role: string; content: string | { html: string[] } }[]
  >([]);
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [_htmlIndex, setHtmlIndex] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['chat', id],
    queryFn: async () => {
      const res = await axios.get(`/api/design/${id}`);
      return res.data;
    },
    enabled: !!initialId.current,
  });

  const postMessage = useMutation({
    mutationFn: async (message: string) => {
      const res = await axios.post<{ html: string[] }>(
        '/api/design',
        { message },
        { headers: { 'x-message-id': id } }
      );
      return {
        data: { role: 'assistant', content: { html: res.data.html } },
        id: res.headers['x-message-id'],
      };
    },
    onSuccess: (result) => {
      setMessages((prev) => [...prev, result.data]);
      !id && navigate(`/chat/${result.id}`, { replace: true });
    },
  });

  const changeHtml = (num: number) => {
    setHtmlIndex((prev) => {
      if (
        (messages[messageIndex] as assistantMessage).content.html.at(
          prev + num
        ) ||
        prev + num === -1
      ) {
        setHtml(
          (messages[messageIndex] as assistantMessage).content.html[
            prev + num === -1
              ? (messages[messageIndex] as assistantMessage).content.html
                  .length - 1
              : prev + num
          ]
        );
        return prev + num === -1
          ? (messages[messageIndex] as assistantMessage).content.html.length - 1
          : prev + num;
      } else {
        setHtml((messages[messageIndex] as assistantMessage).content.html[0]);
        return 0;
      }
    });
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
              <div className="self-start bg-white w-fit max-w-10/12 rounded-lg p-2 shadow">
                {message.content as string}
              </div>
            ) : (
              <div className="ml-auto bg-blue-300 w-fit max-w-10/12 rounded-lg p-2 shadow">
                <button
                  className="bg-teal-400 p-3 rounded-2xl"
                  onClick={() => {
                    setMessageIndex(index);
                    setHtml((message as assistantMessage).content.html[0]);
                    setOpen(true);
                  }}
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
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
          <button
            onClick={() => {
              setMessages((prev) => [
                ...prev,
                { role: 'user', content: message },
              ]);
              postMessage.mutate(message);
              setMessage('');
            }}
            disabled={postMessage.isPending || message.length < 3}
            className="w-18 border border-blue-500 rounded-2xl h-16 mt-auto disabled:bg-gray-500 border-gray-500"
          >
            送信
          </button>
        </div>
      </div>
      <DesignModal
        isOpen={open}
        closeModal={() => setOpen(false)}
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
