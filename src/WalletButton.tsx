import { useMemo } from 'react'
import { Wallet } from 'lucide-react'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { shadowChain } from './providers'

function shortAddress(address?: `0x${string}`) {
  if (!address) return ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export default function WalletButton() {
  const { address, chainId, isConnected } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: switching } = useSwitchChain()

  const connector = useMemo(() => connectors.find((item) => item.type === 'injected') ?? connectors[0], [connectors])

  if (!isConnected) {
    return (
      <button
        className="wallet-btn"
        disabled={!connector || isPending}
        onClick={() => connector && connect({ connector })}
      >
        <Wallet size={17} />
        {isPending ? 'Connecting…' : 'Connect Wallet'}
      </button>
    )
  }

  if (chainId !== shadowChain.id) {
    return (
      <button
        className="wallet-btn warning"
        disabled={switching}
        onClick={() => switchChain({ chainId: shadowChain.id })}
      >
        {switching ? 'Switching…' : 'Switch to Seismic'}
      </button>
    )
  }

  return (
    <button className="wallet-btn connected" onClick={() => disconnect()} title="Disconnect wallet">
      <span className="wallet-dot" />
      {shortAddress(address)}
    </button>
  )
}
