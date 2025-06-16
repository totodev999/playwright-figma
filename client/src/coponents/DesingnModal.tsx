import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import React, { useRef } from 'react';
import { useIframeScript } from '../hooks/useIframeScript';

type DesignModalProps = {
  isOpen: boolean;
  closeModal: () => void;
  html: string;
  changeHtml: (Number) => void;
};

export const DesignModal = ({
  isOpen,
  closeModal,
  html,
  changeHtml,
}: DesignModalProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    <Dialog open={isOpen} onClose={closeModal} className="relative z-100">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in min-w-full min-h-screen data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            <div className="flex align-middle">
              <div className="grid w-10 place-items-center">
                <ArrowLeftIcon
                  onClick={() => changeHtml(-1)}
                  className="size-7 border"
                />
              </div>
              <div className="mx-auto h-[80vh] max-w-[1200px] max-h-[700px] flex-11/12">
                <iframe
                  ref={iframeRef}
                  className="w-full h-full"
                  srcDoc={html}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
              <div className="grid w-10 place-items-center">
                <ArrowRightIcon
                  onClick={() => changeHtml(1)}
                  className="size-7 border"
                />
              </div>
            </div>

            <div className="flex justify-around mt-5">
              <button
                onClick={injectScript}
                className="w-[200px] bg-teal-500 py-4 rounded-2xl text-white"
              >
                copy to Figma
              </button>
              <button
                className="w-[200px] bg-amber-500 px-4 py-2 rounded-2xl text-white"
                onClick={() => {
                  navigator.clipboard.writeText(html);
                  alert('copied');
                }}
              >
                copy HTML
              </button>
              <button className="w-[200px] bg-purple-500 px-4 py-2 rounded-2xl text-white">
                edit HTML
              </button>
            </div>

            <button
              className="mx-auto mt-4 block w-1/2 bg-gray-500 text-white px-4 py-2 rounded-2xl"
              onClick={closeModal}
            >
              close
            </button>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};
