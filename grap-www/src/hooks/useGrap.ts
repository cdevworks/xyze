import { useContext } from 'react'
import { Context } from '../contexts/krapProvider'

const usekrap = () => {
  const { krap } = useContext(Context)
  return krap
}

export default usekrap