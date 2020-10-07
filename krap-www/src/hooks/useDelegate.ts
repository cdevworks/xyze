import { useCallback } from 'react'

import { useWallet } from 'use-wallet'

import { delegate } from '../krapUtils'
import usekrap from './usekrap'

const useDelegate = (address?: string) => {
  const { account } = useWallet()
  const krap = usekrap()

  const handleDelegate = useCallback(async () => {
    const txHash = await delegate(krap ,address || account, account)
    console.log(txHash)
  }, [account, address])

  return { onDelegate: handleDelegate }
}

export default useDelegate