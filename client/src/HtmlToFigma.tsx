import React, { useRef, useState } from 'react';
import { useIframeScript } from './hooks/useIframeScript';
import { Link } from 'react-router';

export const HtmlToFigma = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState('');
  const [mode, setMode] = useState<'HTML' | 'FIGMA'>('HTML');

  const { injectScript } = useIframeScript({
    iframeRef,
    scriptUrl: '/browser.bundle.js',
    onResult: (data) => {
      // ここでクリップボードやアラートなど自由に
      navigator.clipboard.writeText(JSON.stringify(data));
      alert('copied');
    },
  });

  return (
    <div className="grid place-content-center min-w-screen min-h-screen grid-cols-1">
      <h2 className="text-center font-bold text-2xl">HTML to Figma</h2>
      {mode === 'HTML' ? (
        <div className="flex flex-col mx-auto w-11/12">
          <textarea
            id="input"
            placeholder="Input HTML you want to paste to Figma"
            className="border border-blue-500 rounded-2xl p-2 w-full h-[80vh] max-w-[1200px] max-h-[700px]"
            onChange={(e) => setHtml(e.target.value)}
            value={html}
          ></textarea>
          <div className="flex justify-around mt-3">
            <Link
              to="/chat"
              className="bg-gray-500 w-[200px] py-3 rounded-2xl text-center"
            >
              Back to Main
            </Link>
            <button
              onClick={() => setMode('FIGMA')}
              className="bg-amber-500 w-[200px] py-3 rounded-2xl"
            >
              HTML to Figma
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2">
          <div className="mx-auto h-[80vh] max-w-[1200px] max-h-[700px] flex-11/12">
            <iframe
              ref={iframeRef}
              className="w-full h-full"
              srcDoc={html}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
          <div className="flex justify-around mt-3">
            <button
              className="bg-gray-500 w-[200px] py-3 rounded-2xl"
              onClick={() => setMode('HTML')}
            >
              Edit HTML
            </button>
            <button
              onClick={injectScript}
              className="bg-teal-500 w-[200px] py-3 rounded-2xl"
            >
              Copy to Figma
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
