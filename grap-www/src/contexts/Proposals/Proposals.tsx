import React, { useCallback, useEffect, useState } from 'react'

import usekrap from '../../hooks/usekrap'
import { getProposals } from '../../krapUtils'

import Context from './context'
import { Proposal } from './types'


const Proposals: React.FC = ({ children }) => {

  const [proposals, setProposals] = useState<Proposal[]>([])
  const krap = usekrap()
  
  const fetchProposals = useCallback(async () => {
    const propsArr: Proposal[] = await getProposals(krap)

    setProposals(propsArr)
  }, [krap, setProposals])

  useEffect(() => {
    if (krap) {
      fetchProposals()
    }
  }, [krap, fetchProposals])

  return (
    <Context.Provider value={{ proposals }}>
      {children}
    </Context.Provider>
  )
}

export default Proposals
