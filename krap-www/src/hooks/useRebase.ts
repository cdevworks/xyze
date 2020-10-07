import { useCallback } from 'react'

import { useWallet } from 'use-wallet'
import { Krap } from '../krap'
import { rebase } from '../krapUtils'

import usekrap from './usekrap'

const useRebase = () => {
  const { account } = useWallet()
  const krap = usekrap()

  const handleRebase = useCallback(async () => {
    const txHash = await rebase(krap, account)
    console.log(txHash)
  }, [account, krap])

  return { onRebase: handleRebase }
}

export default useRebase