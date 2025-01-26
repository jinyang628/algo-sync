import { ThemeProvider } from 'next-themes';

import ReactDOM from 'react-dom/client';

import { QueryProvider } from '@/components/shared/query-provider';

import '@/styles/globals.css';

import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryProvider>
      <App />
    </QueryProvider>
  </ThemeProvider>,
);
