
import { useEffect, useState } from 'react'

import { URLS } from '../../../connectors/chains'
import { hooks, network } from '../../../connectors/network'
const { useChainId, useAccounts, useIsActivating, useIsActive, useProvider, useENSNames } = hooks

export default () => {

  // const chainId = useChainId()
  // console.log(chainId)
  // const accounts = useAccounts()
  // const isActivating = useIsActivating()
  // const isActive = useIsActive()
  // const provider = useProvider()
  // const ENSNames = useENSNames(provider)
  // const [error, setError] = useState(undefined)

  // attempt to connect eagerly on mount
  useEffect(() => {
    // void network.activate().catch(() => {
    //   console.debug('Failed to connect to network')
    // })
  }, [])

  return <>
    Web3 - Page
  </>

}
