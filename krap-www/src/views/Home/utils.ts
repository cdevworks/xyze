import { Krap } from '../../krap'

import {
  getCurrentPrice as gCP,
  getTargetPrice as gTP,
  getCirculatingSupply as gCS,
  getNextRebaseTimestamp as gNRT,
  getTotalSupply as gTS,
} from '../../krapUtils'

const getCurrentPrice = async (krap: typeof Krap): Promise<number> => {
  // FORBROCK: get current KRAP price
  return gCP(krap)
}

const getTargetPrice = async (krap: typeof Krap): Promise<number> => {
  // FORBROCK: get target KRAP price
  return gTP(krap)
}

const getCirculatingSupply = async (krap: typeof Krap): Promise<string> => {
  // FORBROCK: get circulating supply
  return gCS(krap)
}

const getNextRebaseTimestamp = async (krap: typeof Krap): Promise<number> => {
  // FORBROCK: get next rebase timestamp
  const nextRebase = await gNRT(krap) as number
  return nextRebase * 1000
}

const getTotalSupply = async (krap: typeof Krap): Promise<string> => {
  // FORBROCK: get total supply
  return gTS(krap)
}

export const getStats = async (krap: typeof Krap) => {
  const curPrice = await getCurrentPrice(krap)
  const circSupply = await getCirculatingSupply(krap)
  const nextRebase = await getNextRebaseTimestamp(krap)
  const targetPrice = await getTargetPrice(krap)
  const totalSupply = await getTotalSupply(krap)
  return {
    circSupply,
    curPrice,
    nextRebase,
    targetPrice,
    totalSupply
  }
}
