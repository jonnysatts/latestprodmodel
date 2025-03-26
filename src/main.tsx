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
    
    /* Hide the user profile section - more specific targeting */
    [class*="user-profile"], 
    [class*="auth-section"],
    button:has(span:contains("Logout")),
    div:has(> span:contains("User")),
    div:has(> div:contains("User")),
    div:has(> div:contains("Registered Account")),
    div:has(> span:contains("Registered Account")) {
      display: none !important;
    }
    
    /* Extra specific targeting by position - top right of page elements */
    div.absolute.right-0.top-0,
    div.absolute.right-4.top-4,
    div.absolute.right-4,
    div.fixed.right-4.top-4,
    div.fixed.top-4.right-4,
    div.fixed.right-4 {
      display: none !important;
    }
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
    
    // Direct DOM manipulation to remove the user profile element
    setTimeout(() => {
      // Target by text content
      document.querySelectorAll('div').forEach(el => {
        if (el instanceof HTMLElement) {
          const text = el.textContent || '';
          if ((text.includes('User') && text.includes('Registered Account')) ||
              (text.includes('User') && text.includes('Logout'))) {
            el.style.display = 'none';
            
            // Also hide parents
            let parent = el.parentElement;
            for (let i = 0; i < 3 && parent; i++) {
              if (parent instanceof HTMLElement) {
                parent.style.display = 'none';
                parent = parent.parentElement;
              }
            }
          }
        }
      });
      
      // Also target any button with Logout text
      document.querySelectorAll('button').forEach(btn => {
        if (btn instanceof HTMLElement && btn.textContent?.includes('Logout')) {
          btn.style.display = 'none';
          
          // Hide parent container too
          let parent = btn.parentElement;
          if (parent instanceof HTMLElement) {
            parent.style.display = 'none';
          }
        }
      });
    }, 500);
  }
  
  // Run immediately
  applyFixes();
  
  // Keep running periodically
  setInterval(applyFixes, 1000);
}

// Run fixes immediately
fixInputBeforeRender();

// Direct render without StrictMode or any providers
// This removes the local auth provider which was causing the UserProfile to appear
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
