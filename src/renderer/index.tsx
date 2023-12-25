import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';
import { Provider } from 'react-redux';
import store from './state';
import LoopUpdate from './LoopUpdate';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <LoopUpdate />
      <App  />
    </Provider>
  </React.StrictMode>
);

// calling IPC exposed from preload script
// window.electron.ipcRenderer.once('ipc-example', (arg) => {
//   // eslint-disable-next-line no-console
//   console.log(arg);
// });
// window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);


