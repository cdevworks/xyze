import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import { krap as krapAddress } from '../../../constants/tokenAddresses'
import useTokenBalance from '../../../hooks/useTokenBalance'
import { getDisplayBalance } from '../../../utils/formatBalance'

import { getCurrentVotes, getProposalThreshold } from '../../../krapUtils'
import usekrap from '../../../hooks/usekrap'
import useDelegate from '../../../hooks/useDelegate'
import { useWallet } from 'use-wallet'

import Button from '../../Button'
import CardIcon from '../../CardIcon'
import IconButton from '../../IconButton'
import { AddIcon, RemoveIcon } from '../../icons'
import Label from '../../Label'
import Modal, { ModalProps } from '../../Modal'
import ModalTitle from '../../ModalTitle'


const AccountModal: React.FC<ModalProps> = ({ onDismiss }) => {
  const { account } = useWallet()
  const krap = usekrap()

  const [votes, setvotes] = useState("")
  const [devsVotes, setdevsVotes] = useState("")
  const [proposalThreshold, setProposalThreshold] = useState("")

  const handleSignOutClick = useCallback(() => {
    onDismiss!()
  }, [onDismiss])

  const onDelegateSelf = useDelegate().onDelegate
  const onDelegateDev = useDelegate("0x00007569643bc1709561ec2E86F385Df3759e5DD").onDelegate

  const krapBalance = useTokenBalance(krapAddress)
  const displayBalance = useMemo(() => {
    return getDisplayBalance(krapBalance)
  }, [krapBalance])

  const fetchVotes = useCallback(async () => {
    const votes = await getCurrentVotes(krap, account)
    const devsVotes = await getCurrentVotes(krap, "0x00007569643bc1709561ec2E86F385Df3759e5DD")
    const proposalThreshold = await getProposalThreshold(krap);
    setvotes(getDisplayBalance(votes))
    setdevsVotes(getDisplayBalance(devsVotes))
    setProposalThreshold(getDisplayBalance(proposalThreshold))
  }, [account, krap])

  useEffect(() => {
    if (krap) {
      fetchVotes()
    }
  }, [fetchVotes, krap])
  
  
  return (
    <Modal>
      <ModalTitle text="My Account" />

      <StyledBalanceWrapper>
        <CardIcon>🍇</CardIcon>
        <StyledBalance>
          <StyledValue>{displayBalance}</StyledValue>
          <Label text="KRAP Balance" />
        </StyledBalance>
        <StyledBalance>
          <StyledValue>{votes}</StyledValue>
          <Label text="Current Votes" />
        </StyledBalance>
        <StyledBalance>
          <StyledValue>{devsVotes}</StyledValue>
          <Label text="Devs Votes" />
        </StyledBalance>
        <StyledBalance>
          <Label text="Proposal threshold is" />
          <StyledValue>{proposalThreshold}</StyledValue>
        </StyledBalance>
      </StyledBalanceWrapper>

      <StyledSpacer />
      {votes != "" && votes == "0.000" &&
        <Label text="Not yet?" /> && 
        <Button
          onClick={onDelegateSelf}
          text="Setup Vote"
        />
      }
      <StyledSpacer />
      <Button
        onClick={onDelegateDev}
        text="Share votes to Devs"
      />
      <StyledSpacer />
      <Button
        onClick={handleSignOutClick}
        text="Sign out"
      />
      <StyledSpacer />
    </Modal>
  )
}

const StyledSpacer = styled.div`
  height: ${props => props.theme.spacing[4]}px;
  width: ${props => props.theme.spacing[4]}px;
`

const StyledValue = styled.div`
  color: ${props => props.theme.color.grey[600]};
  font-size: 36px;
  font-weight: 700;
`

const StyledBalance = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
`

const StyledBalanceWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-bottom: ${props => props.theme.spacing[2]}px;
`

const StyledBalanceIcon = styled.div`
  font-size: 36px;
  margin-right: ${props => props.theme.spacing[3]}px;
`

const StyledBalanceActions = styled.div`
  align-items: center;
  display: flex;
  margin-top: ${props => props.theme.spacing[4]}px;
`

export default AccountModal
