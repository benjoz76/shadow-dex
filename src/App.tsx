import { LockKeyhole, ShieldCheck, WalletCards, ArrowRightLeft, Droplets, EyeOff } from 'lucide-react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import WalletButton from './WalletButton'
import { LiquidityPanel, SwapPanel } from './DexPages'
import FaucetPage from './FaucetPage'
import PortfolioPage from './PortfolioPage'

const seismicDocs = 'https://docs.seismic.systems/'
const githubUrl = 'https://github.com/benjoz76/shadow-dex'

function GitHubMark({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.41-1.27.74-1.56-2.57-.29-5.27-1.29-5.27-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.16 1.18A10.9 10.9 0 0 1 12 6.3c.98 0 1.95.13 2.87.39 2.19-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.04c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"/></svg>
}

function Layout({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <header className="nav-wrap">
      <Link to="/" className="brand"><img src="/shadow-logo.svg" alt="Shadow-Dex" /><span>Shadow-Dex</span></Link>
      <nav>
        <NavLink to="/swap">Swap</NavLink>
        <NavLink to="/liquidity">Liquidity</NavLink>
        <NavLink to="/faucet">Faucet</NavLink>
        <NavLink to="/portfolio">Portfolio</NavLink>
        <a href={seismicDocs} target="_blank" rel="noreferrer">Docs</a>
      </nav>
      <div className="nav-actions">
        <a className="icon-btn" href={githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub"><GitHubMark size={19}/></a>
        <WalletButton />
      </div>
    </header>
    <main>{children}</main>
    <footer>
      <Link to="/" className="brand small"><img src="/shadow-logo.svg" alt="" /><span>Shadow-Dex</span></Link>
      <span>Private by design. Built on Seismic.</span>
      <a href={githubUrl} target="_blank" rel="noreferrer"><GitHubMark /> GitHub</a>
    </footer>
  </div>
}

function Home() {
  return <>
    <section className="hero container">
      <div className="hero-copy">
        <div className="eyebrow">PRIVACY-FIRST AMM • BUILT ON SEISMIC</div>
        <h1>Private trading,<br/><span>simplified.</span></h1>
        <p>Shadow-Dex is a minimalist AMM for shielded swaps, liquidity, and portfolio activity on Seismic.</p>
        <div className="hero-actions">
          <Link className="primary-btn" to="/swap">Start Swapping <ArrowRightLeft size={18}/></Link>
          <Link className="secondary-btn" to="/liquidity">View Liquidity</Link>
        </div>
        <div className="trust-row"><span><LockKeyhole size={16}/> Shielded activity</span><span><ShieldCheck size={16}/> Seismic native</span><span><WalletCards size={16}/> You stay in control</span></div>
      </div>
      <div className="hero-visual">
        <div className="orb"></div>
        <div className="shadow-card preview-card">
          <div className="card-top"><div><div className="muted tiny">PRIVATE SWAP</div><h3>Swap</h3></div><span className="status"><ShieldCheck size={15}/> Shielded</span></div>
          <TokenBox label="From" token="sUSD" amount="0.0"/>
          <div className="swap-glyph"><ArrowRightLeft size={18}/></div>
          <TokenBox label="To" token="sETH" amount="Private"/>
          <div className="detail-row"><span>Pool fee</span><strong>0% (MVP)</strong></div>
          <Link className="primary-btn wide" to="/swap">Swap Privately</Link>
        </div>
      </div>
    </section>
    <section className="stats container">
      <Stat title="AMM Mode" value="x · y = k" note="Simple & transparent"/>
      <Stat title="Privacy" value="Shielded" note="Powered by Seismic"/>
      <Stat title="Experience" value="Low Noise" note="Focused interface"/>
      <Stat title="Network" value="Seismic" note="Privacy-first EVM"/>
    </section>
    <section className="feature-grid container">
      <Feature icon={<LockKeyhole/>} title="Private Swaps" body="Trade through a clean interface designed around shielded activity."/>
      <Feature icon={<Droplets/>} title="Shielded Liquidity" body="Add and remove liquidity from a dedicated modern pool experience."/>
      <Feature icon={<EyeOff/>} title="Confidential Portfolio" body="Keep balances and positions hidden until you choose to reveal them."/>
    </section>
  </>
}

function TokenBox({label, token, amount}: {label:string, token:string, amount:string}) {
  return <div className="token-box"><div><span className="muted tiny">{label}</span><strong>{amount}</strong></div><span className="token-pill static-pill"><span className="coin"></span>{token}</span></div>
}
function Stat({title,value,note}:{title:string,value:string,note:string}){return <div className="stat"><span>{title}</span><strong>{value}</strong><small>{note}</small></div>}
function Feature({icon,title,body}:{icon:React.ReactNode,title:string,body:string}){return <div className="feature"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{body}</p></div>}
function PageIntro({kicker,title,body}:{kicker:string,title:string,body:string}) {return <div className="page-intro"><div className="eyebrow">{kicker}</div><h1>{title}</h1><p>{body}</p></div>}

function SwapPage(){return <section className="page container"><PageIntro kicker="SHIELDED EXCHANGE" title="Swap" body="Approve and execute encrypted swaps directly against the deployed ShadowPool."/><SwapPanel/></section>}
function LiquidityPage(){return <section className="page container"><PageIntro kicker="SHIELDED LIQUIDITY" title="Liquidity" body="Approve assets, add liquidity, or withdraw LP shares from the live testnet pool."/><LiquidityPanel/></section>}
function NotFound(){return <section className="page container"><PageIntro kicker="404" title="Lost in the shadow." body="That page does not exist."/><Link className="primary-btn" to="/">Back home</Link></section>}

export default function App(){return <Layout><Routes><Route path="/" element={<Home/>}/><Route path="/swap" element={<SwapPage/>}/><Route path="/liquidity" element={<LiquidityPage/>}/><Route path="/faucet" element={<FaucetPage/>}/><Route path="/portfolio" element={<PortfolioPage/>}/><Route path="*" element={<NotFound/>}/></Routes></Layout>}
