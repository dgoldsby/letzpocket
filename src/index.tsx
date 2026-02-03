import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Add debug logging for production
console.log('🚀 LetzPocket app starting...');
console.log('📱 Environment:', process.env.NODE_ENV);
console.log('🌐 Current URL:', window.location.href);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

try {
  console.log('🔧 Rendering React app...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ React app rendered successfully');
} catch (error) {
  console.error('❌ Error rendering React app:', error);
  
  // Show error on screen for debugging
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ffebee;
    color: #c62828;
    padding: 20px;
    border-radius: 8px;
    font-family: monospace;
    max-width: 80%;
    text-align: center;
  `;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : String(error);
  
  errorDiv.innerHTML = `
    <h2>❌ React App Error</h2>
    <p>${errorMessage}</p>
    <details>
      <summary>Full Error</summary>
      <pre>${errorStack}</pre>
    </details>
  `;
  document.body.appendChild(errorDiv);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
