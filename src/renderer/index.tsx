import { createRoot } from 'react-dom/client';
import App from './App';
import React, { useState } from 'react';
import { Provider } from 'react-redux';
import store from './state';
import LoopUpdate from './LoopUpdate';

import type { Network } from '@web3-react/network';
import { Web3ReactHooks, Web3ReactProvider } from '@web3-react/core'
import { hooks as networkHooks, network } from './connectors/network';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

const connectors : [ Network, Web3ReactHooks ][] = [
  [network, networkHooks]
]

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Web3ReactProvider connectors={connectors}>
        <LoopUpdate />
        <App />
      </Web3ReactProvider>
    </Provider>
  </React.StrictMode>
);

// calling IPC exposed from preload script
// window.electron.ipcRenderer.once('ipc-example', (arg) => {
//   // eslint-disable-next-line no-console
//   console.log(arg);
// });
// window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);


