import React, { createContext, useEffect, useState } from 'react'

import { useWallet } from 'use-wallet'

import { Krap } from '../../krap'

export interface krapContext {
  krap?: typeof Krap
}

export const Context = createContext<krapContext>({
  krap: undefined,
})

declare global {
  interface Window {
    krapsauce: any
  }
}

const krapProvider: React.FC = ({ children }) => {
  const { ethereum } = useWallet()
  const [krap, setkrap] = useState<any>()

  useEffect(() => {
    if (ethereum) {
      const krapLib = new Krap(
        ethereum,
        "1",
        false, {
          defaultAccount: "",
          defaultConfirmations: 1,
          autoGasMultiplier: 1.5,
          testing: false,
          defaultGas: "6000000",
          defaultGasPrice: "1000000000000",
          accounts: [],
          ethereumNodeTimeout: 10000
        }
      )
      setkrap(krapLib)
      window.krapsauce = krapLib
    }
  }, [ethereum])

  return (
    <Context.Provider value={{ krap }}>
      {children}
    </Context.Provider>
  )
}

export default krapProvider
