import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * iframe内でスクリプトを実行し、postMessageのレスポンスを受け取るためのフック
 *
 * @param options
 *   iframeRef: 操作したいiframeのref
 *   scriptUrl: injectしたいスクリプトのURL
 *   onResult: postMessageのdataを受け取るコールバック
 */
export function useIframeScript({
  iframeRef,
  scriptUrl = '/browser.bundle.js',
  onResult,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  scriptUrl?: string;
  onResult?: (data: any) => void;
}) {
  const [result, setResult] = useState<any>(null);

  const injectScript = useCallback(() => {
    const iframe = iframeRef?.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      console.warn('iframeのdocumentがまだない');
      return;
    }

    if ([...doc.scripts].some((s) => s.src === scriptUrl)) return;

    try {
      const script = doc.createElement('script');
      script.src = scriptUrl;
      doc.body.appendChild(script);
    } catch (err) {
      console.log('doc.body.appendChild(script);', err);
      alert('Maybe because of CSP policy, failed');
    }
  }, [iframeRef, scriptUrl]);

  // handle postMessage
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'RESULT') {
        setResult(e.data.data);
        onResult?.(e.data.data);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onResult]);

  return {
    injectScript,
    result,
  };
}
