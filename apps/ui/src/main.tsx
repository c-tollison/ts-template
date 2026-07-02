import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { NotFoundPage } from './pages/not-found';
import { UsersPage } from './pages/users';
import { ErrorBoundary } from '@/components/error-boundary';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';

import './index.css';

import { RootLayout } from './layout/root-layout';

function Root() {
    return (
        <ErrorBoundary>
            <QueryProvider>
                <ThemeProvider
                    defaultTheme="system"
                    storageKey="ts-template-theme"
                >
                    <RootLayout />
                </ThemeProvider>
            </QueryProvider>
        </ErrorBoundary>
    );
}

const router = createBrowserRouter([
    {
        element: <Root />,
        children: [
            {
                path: '/',
                element: <UsersPage />,
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
