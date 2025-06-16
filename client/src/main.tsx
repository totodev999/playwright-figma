import { StrictMode, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, useParams } from 'react-router';
import './index.css';
import { App } from './App';
import React from 'react';
import { HtmlToFigma } from './HtmlToFigma';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

const router = createBrowserRouter([
  {
    path: '/chat',
    element: <App />,
  },
  {
    path: '/chat/:id',
    element: <App />,
  },
  {
    path: '/html-to-figma',
    element: <HtmlToFigma />,
  },
]);

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
