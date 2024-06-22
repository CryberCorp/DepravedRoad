import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Network, OrdConnectProvider } from '@ordzaar/ord-connect';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <OrdConnectProvider initialNetwork={Network.TESTNET}>
      <App />
    </OrdConnectProvider>
  </React.StrictMode>
);
