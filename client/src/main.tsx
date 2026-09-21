import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import './styles/global.css';
import './styles/components.css';
import './styles/redrock.css';
import './styles/seawolf.css';
import './styles/sfl.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
