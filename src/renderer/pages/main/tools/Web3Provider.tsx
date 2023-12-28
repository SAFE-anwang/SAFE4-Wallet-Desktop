
import type { Network } from '@web3-react/network';
import { useWeb3React, Web3ReactHooks, Web3ReactProvider } from '@web3-react/core'
import { hooks as networkHooks, network } from '../../../connectors/network'
import Web3Page from './Web3Page';

const connectors: [ Network, Web3ReactHooks ][] = [
  [network, networkHooks]
]


function Child() {
  const { connector } = useWeb3React()
  console.log(`Priority Connector is: llll`)
  return null
}

export default function Web3Provier(){

  return (
    <Web3ReactProvider connectors={connectors}>
     <Child />
    </Web3ReactProvider>
  )


}
