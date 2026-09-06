import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, ExternalLink, Gift, ShieldCheck } from 'lucide-react'
import { formatUnits, isAddress, zeroAddress } from 'viem'
import { useAccount, usePublicClient, useReadContract, useWriteContract } from 'wagmi'
import WalletButton from './WalletButton'
import { shadowChain } from './providers'
import './FaucetPage.css'

const defaultFaucetAddress = '0xc5E8524cF438328a1d3c15c995cE0De154B50202'
const faucetAddressValue = String(import.meta.env.VITE_FAUCET_ADDRESS || defaultFaucetAddress).trim()
const faucetConfigured = isAddress(faucetAddressValue) && faucetAddressValue !== zeroAddress
const FAUCET = faucetAddressValue as `0x${string}`
const GAS_FAUCET = 'https://community-faucet.seismictest.net/'
const COOLDOWN_SECONDS = 24 * 60 * 60

const faucetAbi = [
  { type: 'function', name: 'claim', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'CLAIM_AMOUNT0', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'CLAIM_AMOUNT1', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'lastClaimAt', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const

type FaucetState = { message: string; hash?: `0x${string}`; error?: string }

function formatCountdown(seconds: number) {
  if (seconds <= 0) return 'READY NOW'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatTokenAmount(value: bigint | undefined) {
  if (value === undefined) return '100'
  return Number(formatUnits(value, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 })
}

export default function FaucetPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  const [running, setRunning] = useState(false)
  const [state, setState] = useState<FaucetState | null>(null)

  const readBase = { address: faucetConfigured ? FAUCET : undefined, abi: faucetAbi, chainId: shadowChain.id } as const
  const { data: amount0 } = useReadContract({ ...readBase, functionName: 'CLAIM_AMOUNT0' })
  const { data: amount1 } = useReadContract({ ...readBase, functionName: 'CLAIM_AMOUNT1' })
  const { data: lastClaimAt, refetch: refetchLastClaim } = useReadContract({
    ...readBase,
    functionName: 'lastClaimAt',
    args: address ? [address] : undefined,
    query: { enabled: faucetConfigured && !!address },
  })

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const remaining = useMemo(() => {
    const previous = Number(lastClaimAt || 0n)
    if (!previous) return 0
    return Math.max(0, previous + COOLDOWN_SECONDS - now)
  }, [lastClaimAt, now])

  async function handleClaim() {
    try {
      if (!isConnected || !address) throw new Error('Connect your wallet first')
      if (!faucetConfigured) throw new Error('ShadowFaucet has not been deployed yet')
      if (remaining > 0) throw new Error(`Next claim available in ${formatCountdown(remaining)}`)
      if (!publicClient) throw new Error('Public client is not ready')

      setRunning(true)
      setState({ message: 'Confirm the faucet transaction in your wallet…' })
      const hash = await writeContractAsync({
        address: FAUCET,
        abi: faucetAbi,
        functionName: 'claim',
        chainId: shadowChain.id,
      })

      setState({ message: 'Claim submitted — waiting for confirmation…', hash })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success') throw new Error('Faucet transaction reverted on-chain')

      await refetchLastClaim()
      setNow(Math.floor(Date.now() / 1000))
      setState({ message: 'sUSD and sETH claimed successfully', hash })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Faucet claim failed'
      setState({ message: '', error: message.includes('User rejected') ? 'Transaction cancelled in wallet' : message })
    } finally {
      setRunning(false)
    }
  }

  const claimDisabled = running || remaining > 0 || !faucetConfigured

  return <section className="page container">
    <div className="page-intro">
      <div className="eyebrow">TESTNET ASSET STATION</div>
      <h1>Faucet</h1>
      <p>Claim both Shadow assets in one transaction, then test private swaps and liquidity.</p>
    </div>
    <div className="center-card shadow-card app-card faucet-card">
      <div className="card-top"><div><div className="muted tiny">DUAL ASSET DROP</div><h2>Test tokens</h2></div><span className="status"><ShieldCheck size={15}/> Testnet only</span></div>
      <div className="faucet-assets">
        <div className="faucet-asset"><span className="faucet-coin">$</span><div><strong>sUSD</strong><small>Shadow USD</small></div><b>{formatTokenAmount(amount0)}</b></div>
        <div className="faucet-asset"><span className="faucet-coin alt">Ξ</span><div><strong>sETH</strong><small>Shadow ETH</small></div><b>{formatTokenAmount(amount1)}</b></div>
      </div>
      <div className="faucet-window"><span><Clock3 size={16}/> Claim window</span><strong className={remaining > 0 ? '' : 'ready-text'}>{formatCountdown(remaining)}</strong></div>
      {!faucetConfigured && <div className="tx-feedback tx-error">Faucet contract address is not configured yet.</div>}
      {!isConnected ? <WalletButton/> : <button className="primary-btn wide faucet-claim" disabled={claimDisabled} onClick={handleClaim}><Gift size={18}/>{running ? 'Claiming…' : remaining > 0 ? 'Claim unavailable' : 'Claim sUSD + sETH'}</button>}
      {state && <div className={`tx-feedback ${state.error ? 'tx-error' : ''}`}><div>{state.error ? state.error : <><CheckCircle2 size={15}/> {state.message}</>}</div>{state.hash && <a href={`https://seismic-testnet.socialscan.io/tx/${state.hash}`} target="_blank" rel="noreferrer">View transaction ↗</a>}</div>}
      <a className="gas-faucet-link" href={GAS_FAUCET} target="_blank" rel="noreferrer">Need SIZW for gas? Open Seismic Faucet <ExternalLink size={15}/></a>
    </div>
  </section>
}
