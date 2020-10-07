import { useCallback, useEffect, useState } from 'react'

import BigNumber from 'bignumber.js'
import { useWallet } from 'use-wallet'
import { Contract } from "web3-eth-contract"

import { getStaked } from '../krapUtils'
import usekrap from './usekrap'

const useStakedBalance = (pool: Contract) => {
  const [balance, setBalance] = useState(new BigNumber(0))
  const { account }: { account: string } = useWallet()
  const krap = usekrap()

  const fetchBalance = useCallback(async () => {
    const balance = await getStaked(krap, pool, account)
    setBalance(new BigNumber(balance))
  }, [account, pool, krap])

  useEffect(() => {
    if (account && pool && krap) {
      fetchBalance()
    }
  }, [account, pool, setBalance, krap])

  return balance
}

export default useStakedBalance