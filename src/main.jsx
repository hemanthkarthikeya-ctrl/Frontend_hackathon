import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { installCursor } from './utils/cursorFx';

installCursor();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);