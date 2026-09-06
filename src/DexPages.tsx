import { useMemo, useState } from 'react'
import { ArrowRightLeft, CheckCircle2, Droplets, ShieldCheck } from 'lucide-react'
import { parseUnits } from 'viem'
import { useAccount, usePublicClient } from 'wagmi'
import { useShieldedContract, useShieldedWallet } from 'seismic-react'
import WalletButton from './WalletButton'

const TOKEN0 = (import.meta.env.VITE_TOKEN0_ADDRESS || '0xe744F18e430084009918BFE307A384FCB7b165c1') as `0x${string}`
const TOKEN1 = (import.meta.env.VITE_TOKEN1_ADDRESS || '0xa9a612D444Bcf1F5c02Ff4dC65e86ADa31a1CE5f') as `0x${string}`
const POOL = (import.meta.env.VITE_SHADOW_POOL_ADDRESS || '0xbbb7588c320e71C3f47a67B6ced3eE67DBCa1D68') as `0x${string}`
const EXPLORER = 'https://seismic-testnet.socialscan.io/tx/'
const GAS = 1_500_000n

const tokenAbi = [{
  type: 'function', name: 'approve', stateMutability: 'nonpayable',
  inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'suint256' }],
  outputs: [{ name: '', type: 'bool' }],
}] as const

const poolAbi = [
  { type: 'function', name: 'swap', stateMutability: 'nonpayable', inputs: [{ name: 'token0In', type: 'suint256' }, { name: 'token1In', type: 'suint256' }], outputs: [] },
  { type: 'function', name: 'addLiquidity', stateMutability: 'nonpayable', inputs: [{ name: 'amount0', type: 'suint256' }, { name: 'amount1', type: 'suint256' }], outputs: [] },
  { type: 'function', name: 'removeLiquidity', stateMutability: 'nonpayable', inputs: [{ name: 'shares', type: 'suint256' }], outputs: [] },
] as const

type TxState = { message: string; hash?: `0x${string}`; error?: string }

function toRaw(value: string) {
  if (!value.trim()) throw new Error('Enter an amount')
  const amount = parseUnits(value, 18)
  if (amount <= 0n) throw new Error('Amount must be greater than zero')
  return amount
}

function TxFeedback({ state }: { state: TxState | null }) {
  if (!state) return null
  return <div className={`tx-feedback ${state.error ? 'tx-error' : ''}`}>
    <div>{state.error ? state.error : <><CheckCircle2 size={15}/> {state.message}</>}</div>
    {state.hash && <a href={`${EXPLORER}${state.hash}`} target="_blank" rel="noreferrer">View transaction ↗</a>}
  </div>
}

function AmountBox({ label, token, value, onChange }: { label: string; token: string; value: string; onChange: (v: string) => void }) {
  return <label className="token-box token-input-box">
    <div><span className="muted tiny">{label}</span><input inputMode="decimal" placeholder="0.0" value={value} onChange={e => onChange(e.target.value)} /></div>
    <span className="token-pill static-pill"><span className="coin"></span>{token}</span>
  </label>
}

async function ensureSuccess(publicClient: ReturnType<typeof usePublicClient>, hash: `0x${string}`) {
  if (!publicClient) throw new Error('Public client is not ready')
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') throw new Error('Transaction reverted on-chain')
}

function ShieldedStatus({ loaded, error }: { loaded: boolean; error: string | null }) {
  if (error) return <div className="tx-feedback tx-error">Shielded wallet: {error}</div>
  if (!loaded) return <div className="tx-feedback">Initializing shielded wallet…</div>
  return null
}

export function SwapPanel() {
  const { isConnected } = useAccount()
  const { walletClient, loaded, error: shieldedError } = useShieldedWallet()
  const publicClient = usePublicClient()
  const [direction, setDirection] = useState<'0to1' | '1to0'>('0to1')
  const [amount, setAmount] = useState('1')
  const [state, setState] = useState<TxState | null>(null)
  const [running, setRunning] = useState(false)

  const raw = useMemo(() => { try { return toRaw(amount) } catch { return 0n } }, [amount])
  const inputToken = direction === '0to1' ? TOKEN0 : TOKEN1
  const inputSymbol = direction === '0to1' ? 'sUSD' : 'sETH'
  const outputSymbol = direction === '0to1' ? 'sETH' : 'sUSD'
  const shieldedReady = loaded && !!walletClient && !shieldedError

  const { contract: inputContract, error: inputContractError } = useShieldedContract({ address: inputToken, abi: tokenAbi })
  const { contract: poolContract, error: poolContractError } = useShieldedContract({ address: POOL, abi: poolAbi })

  async function handleSwap() {
    try {
      if (!isConnected) throw new Error('Connect your wallet first')
      if (!shieldedReady) throw new Error(shieldedError || 'Shielded wallet is still initializing')
      if (!inputContract) throw new Error(inputContractError?.message || 'Token contract client is not ready')
      if (!poolContract) throw new Error(poolContractError?.message || 'Pool contract client is not ready')

      const value = toRaw(amount)
      if (value !== raw) throw new Error('Amount changed; try again')
      setRunning(true)

      setState({ message: `Approving ${inputSymbol}…` })
      const approveHash = await inputContract.write.approve([POOL, raw], { gas: GAS })
      await ensureSuccess(publicClient, approveHash)

      setState({ message: 'Submitting shielded swap…' })
      const swapArgs = direction === '0to1' ? [raw, 0n] as const : [0n, raw] as const
      const swapHash = await poolContract.write.swap(swapArgs, { gas: GAS })
      await ensureSuccess(publicClient, swapHash)

      setState({ message: `${inputSymbol} → ${outputSymbol} swap confirmed`, hash: swapHash })
    } catch (err) {
      setState({ message: '', error: err instanceof Error ? err.message : 'Swap failed' })
    } finally { setRunning(false) }
  }

  return <div className="center-card shadow-card app-card">
    <div className="card-top"><h2>Private Swap</h2><span className="status"><ShieldCheck size={15}/> Shielded</span></div>
    <AmountBox label="From" token={inputSymbol} value={amount} onChange={setAmount}/>
    <button className="swap-glyph swap-button" onClick={() => { setDirection(v => v === '0to1' ? '1to0' : '0to1'); setState(null) }} aria-label="Reverse swap"><ArrowRightLeft size={18}/></button>
    <div className="token-box output-box"><div><span className="muted tiny">To</span><strong>Private quote</strong></div><span className="token-pill static-pill"><span className="coin"></span>{outputSymbol}</span></div>
    <div className="detail-row"><span>Pool fee</span><strong>0% (MVP)</strong></div>
    <div className="detail-row"><span>Route</span><strong>Direct ShadowPool</strong></div>
    {!isConnected ? <WalletButton/> : <button className="primary-btn wide" disabled={running || raw === 0n || !shieldedReady || !inputContract || !poolContract} onClick={handleSwap}>{running ? 'Encrypting & confirming…' : !shieldedReady ? 'Initializing Shielded Wallet…' : `Approve & Swap ${inputSymbol}`}</button>}
    {isConnected && <ShieldedStatus loaded={loaded} error={shieldedError}/>}<TxFeedback state={state}/>
  </div>
}

export function LiquidityPanel() {
  const { isConnected } = useAccount()
  const { walletClient, loaded, error: shieldedError } = useShieldedWallet()
  const publicClient = usePublicClient()
  const [amount0, setAmount0] = useState('10')
  const [amount1, setAmount1] = useState('10')
  const [shares, setShares] = useState('1')
  const [state, setState] = useState<TxState | null>(null)
  const [running, setRunning] = useState(false)

  const raw0 = useMemo(() => { try { return toRaw(amount0) } catch { return 0n } }, [amount0])
  const raw1 = useMemo(() => { try { return toRaw(amount1) } catch { return 0n } }, [amount1])
  const rawShares = useMemo(() => { try { return toRaw(shares) } catch { return 0n } }, [shares])
  const shieldedReady = loaded && !!walletClient && !shieldedError

  const { contract: token0Contract, error: token0ContractError } = useShieldedContract({ address: TOKEN0, abi: tokenAbi })
  const { contract: token1Contract, error: token1ContractError } = useShieldedContract({ address: TOKEN1, abi: tokenAbi })
  const { contract: poolContract, error: poolContractError } = useShieldedContract({ address: POOL, abi: poolAbi })

  async function handleAdd() {
    try {
      if (!isConnected) throw new Error('Connect your wallet first')
      if (!shieldedReady) throw new Error(shieldedError || 'Shielded wallet is still initializing')
      if (!token0Contract) throw new Error(token0ContractError?.message || 'sUSD contract client is not ready')
      if (!token1Contract) throw new Error(token1ContractError?.message || 'sETH contract client is not ready')
      if (!poolContract) throw new Error(poolContractError?.message || 'Pool contract client is not ready')
      toRaw(amount0); toRaw(amount1); setRunning(true)

      setState({ message: 'Approving sUSD…' })
      const h0 = await token0Contract.write.approve([POOL, raw0], { gas: GAS })
      await ensureSuccess(publicClient, h0)

      setState({ message: 'Approving sETH…' })
      const h1 = await token1Contract.write.approve([POOL, raw1], { gas: GAS })
      await ensureSuccess(publicClient, h1)

      setState({ message: 'Adding shielded liquidity…' })
      const hp = await poolContract.write.addLiquidity([raw0, raw1], { gas: GAS })
      await ensureSuccess(publicClient, hp)
      setState({ message: 'Liquidity added successfully', hash: hp })
    } catch (err) { setState({ message: '', error: err instanceof Error ? err.message : 'Add liquidity failed' }) }
    finally { setRunning(false) }
  }

  async function handleRemove() {
    try {
      if (!isConnected) throw new Error('Connect your wallet first')
      if (!shieldedReady) throw new Error(shieldedError || 'Shielded wallet is still initializing')
      if (!poolContract) throw new Error(poolContractError?.message || 'Pool contract client is not ready')
      toRaw(shares); setRunning(true); setState({ message: 'Removing shielded liquidity…' })
      const hash = await poolContract.write.removeLiquidity([rawShares], { gas: GAS })
      await ensureSuccess(publicClient, hash)
      setState({ message: 'Liquidity removed successfully', hash })
    } catch (err) { setState({ message: '', error: err instanceof Error ? err.message : 'Remove liquidity failed' }) }
    finally { setRunning(false) }
  }

  return <div className="two-col">
    <div className="shadow-card app-card"><h2>Add Liquidity</h2><AmountBox label="Token A" token="sUSD" value={amount0} onChange={setAmount0}/><AmountBox label="Token B" token="sETH" value={amount1} onChange={setAmount1}/><div className="detail-row"><span>Pool fee</span><strong>0% (MVP)</strong></div>{!isConnected ? <WalletButton/> : <button className="primary-btn wide" disabled={running || raw0 === 0n || raw1 === 0n || !shieldedReady || !token0Contract || !token1Contract || !poolContract} onClick={handleAdd}>{running ? 'Processing…' : !shieldedReady ? 'Initializing Shielded Wallet…' : 'Approve & Add Liquidity'}</button>}{isConnected && <ShieldedStatus loaded={loaded} error={shieldedError}/>}<TxFeedback state={state}/></div>
    <div className="shadow-card app-card"><h2>Remove Liquidity</h2><p className="muted form-copy">Enter the LP share amount to withdraw. Your share balance remains shielded.</p><AmountBox label="LP shares" token="LP" value={shares} onChange={setShares}/><div className="detail-row"><span>Withdrawal</span><strong>Both pool assets</strong></div>{!isConnected ? <WalletButton/> : <button className="secondary-action wide" disabled={running || rawShares === 0n || !shieldedReady || !poolContract} onClick={handleRemove}><Droplets size={17}/>{running ? 'Processing…' : !shieldedReady ? 'Initializing…' : 'Remove Liquidity'}</button>}<TxFeedback state={state}/></div>
  </div>
}
