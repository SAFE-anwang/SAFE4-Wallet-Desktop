import { createRoot } from 'react-dom/client';
import App from './App';
import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import store from './state';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
    </Provider>
  </React.StrictMode>
);




