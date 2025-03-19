import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Emergency input fix
function fixInputBeforeRender() {
  // Create a stylesheet
  const style = document.createElement('style');
  style.textContent = `
    input, textarea, select, button {
      pointer-events: auto !important;
      position: relative !important;
      z-index: 99999 !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    * { pointer-events: auto !important; }
  `;
  document.head.appendChild(style);
  
  // Apply input fixes
  function applyFixes() {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.pointerEvents = 'auto';
        el.style.position = 'relative';
        el.style.zIndex = '99999';
      }
    });
  }
  
  // Run immediately
  applyFixes();
  
  // Keep running periodically
  setInterval(applyFixes, 500);
}

// Run fixes immediately
fixInputBeforeRender();

// Direct render without StrictMode
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
