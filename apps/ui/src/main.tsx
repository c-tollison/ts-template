import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { HelloWorldPage } from './pages/hello-world';
import { NotFoundPage } from './pages/not-found';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/providers/theme-provider';

import './index.css';

import { RootLayout } from './layout/root-layout';

function Root() {
    return (
        <ErrorBoundary>
            <ThemeProvider defaultTheme="system" storageKey="ts-template-theme">
                <RootLayout />
            </ThemeProvider>
        </ErrorBoundary>
    );
}

const router = createBrowserRouter([
    {
        element: <Root />,
        children: [
            {
                path: '/',
                element: <HelloWorldPage />,
            },
            {
                path: '*',
                element: <NotFoundPage />,
            },
        ],
    },
]);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
