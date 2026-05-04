// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

import { Security } from '@okta/okta-react';
import { OktaAuth } from '@okta/okta-auth-js';
import oktaConfig from './oktaConfig';

const oktaAuth = new OktaAuth(oktaConfig);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>

<Security
  oktaAuth={oktaAuth}
  restoreOriginalUri={async (_oktaAuth, originalUri) => {
    window.location.replace(originalUri || "/");
  }}
>

      <App />
    </Security>
  </React.StrictMode>,
);
