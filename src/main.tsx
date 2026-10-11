import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root ontbreekt');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline gebruik (#21): enkel in de gebouwde versie, niet tijdens het ontwikkelen.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}
