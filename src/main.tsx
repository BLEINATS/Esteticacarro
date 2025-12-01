import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppProvider } from './context/AppContext';
import { DialogProvider } from './context/DialogContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <DialogProvider>
        <App />
      </DialogProvider>
    </AppProvider>
  </StrictMode>,
);
