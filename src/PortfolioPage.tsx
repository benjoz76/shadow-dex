import { useState } from 'react'
import { Droplets, Eye, EyeOff, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useShieldedWallet, useSignedReadContract } from 'seismic-react'
import WalletButton from './WalletButton'
import './PortfolioPage.css'

const TOKEN0 = (import.meta.env.VITE_TOKEN0_ADDRESS || '0xe744F18e430084009918BFE307A384FCB7b165c1') as `0x${string}`
const TOKEN1 = (import.meta.env.VITE_TOKEN1_ADDRESS || '0xa9a612D444Bcf1F5c02Ff4dC65e86ADa31a1CE5f') as `0x${string}`
const POOL = (import.meta.env.VITE_SHADOW_POOL_ADDRESS || '0xbbb7588c320e71C3f47a67B6ced3eE67DBCa1D68') as `0x${string}`

const tokenBalanceAbi = [{
  type: 'function', name: 'myBalance', stateMutability: 'view', inputs: [],
  outputs: [{ name: '', type: 'uint256' }],
}] as const

const liquidityAbi = [{
  type: 'function', name: 'myLiquidity', stateMutability: 'view', inputs: [],
  outputs: [{ name: '', type: 'uint256' }],
}] as const

type PrivateBalances = { sUSD: bigint; sETH: bigint; lp: bigint }

function asBigInt(value: unknown) {
  if (typeof value === 'bigint') return value
  if (typeof value === 'string' || typeof value === 'number') return BigInt(value)
  throw new Error('The signed read returned an unsupported balance value')
}

function formatPrivateAmount(value: bigint) {
  const [whole, decimals = ''] = formatUnits(value, 18).split('.')
  const fraction = decimals.slice(0, 4).replace(/0+$/, '')
  return `${BigInt(whole).toLocaleString()}${fraction ? `.${fraction}` : ''}`
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Private balance read failed'
  return /reject|denied|cancel/i.test(message) ? 'Signature request cancelled in wallet' : message
}

export default function PortfolioPage() {
  const { isConnected } = useAccount()
  const { loaded, error: shieldedError } = useShieldedWallet()
  const { signedRead: readSUSD } = useSignedReadContract({ address: TOKEN0, abi: tokenBalanceAbi, functionName: 'myBalance' })
  const { signedRead: readSETH } = useSignedReadContract({ address: TOKEN1, abi: tokenBalanceAbi, functionName: 'myBalance' })
  const { signedRead: readLiquidity } = useSignedReadContract({ address: POOL, abi: liquidityAbi, functionName: 'myLiquidity' })
  const [balances, setBalances] = useState<PrivateBalances | null>(null)
  const [visible, setVisible] = useState(false)
  const [reading, setReading] = useState(false)
  const [readStep, setReadStep] = useState('')
  const [error, setError] = useState('')

  async function revealBalances() {
    if (visible) {
      setVisible(false)
      setError('')
      return
    }
    if (balances) {
      setVisible(true)
      setError('')
      return
    }

    try {
      if (!isConnected) throw new Error('Connect your wallet before revealing balances')
      if (!loaded) throw new Error(shieldedError || 'Shielded wallet is still initializing')

      setReading(true)
      setError('')
      setReadStep('Sign 1 of 3 — sUSD balance')
      const sUSD = asBigInt(await readSUSD())
      setReadStep('Sign 2 of 3 — sETH balance')
      const sETH = asBigInt(await readSETH())
      setReadStep('Sign 3 of 3 — LP position')
      const lp = asBigInt(await readLiquidity())

      setBalances({ sUSD, sETH, lp })
      setVisible(true)
      setReadStep('')
    } catch (readError) {
      setError(friendlyError(readError))
      setReadStep('')
    } finally {
      setReading(false)
    }
  }

  function refreshBalances() {
    setBalances(null)
    setVisible(false)
    setError('Balances hidden. Reveal again to request fresh signed reads.')
  }

  const rows = [
    { label: 'sUSD', value: balances?.sUSD },
    { label: 'sETH', value: balances?.sETH },
    { label: 'LP Share', value: balances?.lp },
  ]

  return <section className="page container">
    <div className="page-intro">
      <div className="eyebrow">PRIVATE OVERVIEW</div>
      <h1>Portfolio</h1>
      <p>Reveal balances only through wallet-authorized signed reads.</p>
    </div>
    <div className="portfolio-grid">
      <div className="shadow-card app-card">
        <div className="card-top">
          <div><div className="muted tiny">SIGNED READS</div><h2>Balances</h2></div>
          <button className="ghost-button" type="button" disabled={reading || (isConnected && !loaded)} onClick={revealBalances} aria-pressed={visible}>
            {reading ? <RefreshCw className="spin" size={16}/> : visible ? <Eye size={16}/> : <EyeOff size={16}/>}
            {reading ? 'Reading…' : visible ? 'Visible' : 'Hidden'}
          </button>
        </div>
        {rows.map(row => <div className="asset-row" key={row.label}>
          <div><span className="coin"></span><strong>{row.label}</strong></div>
          <span className={visible ? 'balance-value' : 'balance-mask'}>
            {visible && row.value !== undefined ? formatPrivateAmount(row.value) : '••••••'}
          </span>
        </div>)}
        {!isConnected && <div className="portfolio-connect"><WalletButton/></div>}
        {isConnected && !loaded && !shieldedError && <div className="tx-feedback">Initializing shielded wallet…</div>}
        {shieldedError && <div className="tx-feedback tx-error">Shielded wallet: {shieldedError}</div>}
        {readStep && <div className="tx-feedback"><ShieldCheck size={15}/>{readStep}</div>}
        {error && <div className={`tx-feedback ${/failed|cancel|error/i.test(error) ? 'tx-error' : ''}`}>{error}</div>}
        {balances && <button className="portfolio-refresh" type="button" onClick={refreshBalances} disabled={reading}><RefreshCw size={14}/> Request fresh balances</button>}
      </div>

      <div className="shadow-card app-card">
        <h2>Positions</h2>
        <div className="empty-state">
          {!visible ? <>
            <WalletCards size={34}/><h3>Private position data</h3>
            <p>Reveal your balances to securely read the shielded LP position.</p>
          </> : balances && balances.lp > 0n ? <>
            <Droplets size={34}/><h3>Active liquidity position</h3>
            <p><strong className="position-value">{formatPrivateAmount(balances.lp)} LP shares</strong></p>
          </> : <>
            <Droplets size={34}/><h3>No liquidity position</h3>
            <p>Add liquidity to create your first private LP position.</p>
          </>}
        </div>
      </div>
    </div>
  </section>
}
