import { Github, LockKeyhole, ShieldCheck, WalletCards, ArrowRightLeft, Droplets, EyeOff, ExternalLink } from 'lucide-react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'

const seismicDocs = 'https://docs.seismic.systems/'
const githubUrl = 'https://github.com/benjoz76/shadow-dex'

function Layout({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <header className="nav-wrap">
      <Link to="/" className="brand"><img src="/shadow-logo.svg" alt="Shadow-Dex" /><span>Shadow-Dex</span></Link>
      <nav>
        <NavLink to="/swap">Swap</NavLink>
        <NavLink to="/liquidity">Liquidity</NavLink>
        <NavLink to="/portfolio">Portfolio</NavLink>
        <a href={seismicDocs} target="_blank" rel="noreferrer">Docs</a>
      </nav>
      <div className="nav-actions">
        <a className="icon-btn" href={githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={19}/></a>
        <button className="wallet-btn">Connect Wallet</button>
      </div>
    </header>
    <main>{children}</main>
    <footer>
      <Link to="/" className="brand small"><img src="/shadow-logo.svg" alt="" /><span>Shadow-Dex</span></Link>
      <span>Private by design. Built on Seismic.</span>
      <a href={githubUrl} target="_blank" rel="noreferrer"><Github size={18}/> GitHub</a>
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
          <TokenBox label="From" token="sUSDC" amount="0.0"/>
          <div className="swap-glyph"><ArrowRightLeft size={18}/></div>
          <TokenBox label="To" token="sETH" amount="0.0"/>
          <div className="slippage"><span>Slippage</span><div><button>0.1%</button><button className="active-chip">0.5%</button><button>1%</button></div></div>
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
  return <div className="token-box"><div><span className="muted tiny">{label}</span><strong>{amount}</strong></div><button className="token-pill"><span className="coin"></span>{token}⌄</button></div>
}
function Stat({title,value,note}:{title:string,value:string,note:string}){return <div className="stat"><span>{title}</span><strong>{value}</strong><small>{note}</small></div>}
function Feature({icon,title,body}:{icon:React.ReactNode,title:string,body:string}){return <div className="feature"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{body}</p></div>}

function PageIntro({kicker,title,body}:{kicker:string,title:string,body:string}) {return <div className="page-intro"><div className="eyebrow">{kicker}</div><h1>{title}</h1><p>{body}</p></div>}

function SwapPage(){return <section className="page container"><PageIntro kicker="SHIELDED EXCHANGE" title="Swap" body="A focused private-swap workspace for Shadow-Dex."/><div className="center-card shadow-card app-card"><div className="card-top"><h2>Private Swap</h2><span className="status"><ShieldCheck size={15}/> Shielded</span></div><TokenBox label="From" token="sUSDC" amount="0.0"/><div className="swap-glyph"><ArrowRightLeft/></div><TokenBox label="To" token="sETH" amount="0.0"/><div className="detail-row"><span>Slippage tolerance</span><strong>0.5%</strong></div><div className="detail-row"><span>Route</span><strong>Direct pool</strong></div><button className="primary-btn wide">Connect Wallet to Swap</button></div></section>}

function LiquidityPage(){return <section className="page container"><PageIntro kicker="SHIELDED LIQUIDITY" title="Liquidity" body="Provide liquidity and manage positions without clutter."/><div className="two-col"><div className="shadow-card app-card"><h2>Add Liquidity</h2><TokenBox label="Token A" token="sUSDC" amount="0.0"/><TokenBox label="Token B" token="sETH" amount="0.0"/><div className="detail-row"><span>Pool fee</span><strong>0.30%</strong></div><button className="primary-btn wide">Connect Wallet</button></div><div className="shadow-card app-card"><h2>Your Positions</h2><div className="empty-state"><Droplets size={34}/><h3>No positions yet</h3><p>Your active LP positions will appear here.</p></div></div></div></section>}

function PortfolioPage(){return <section className="page container"><PageIntro kicker="PRIVATE OVERVIEW" title="Portfolio" body="A minimal view of balances, positions, and activity."/><div className="portfolio-grid"><div className="shadow-card app-card"><div className="card-top"><h2>Balances</h2><button className="ghost-button"><EyeOff size={16}/> Hidden</button></div>{['sUSDC','sETH','LP Token'].map(x=><div className="asset-row" key={x}><div><span className="coin"></span><strong>{x}</strong></div><span>••••••</span></div>)}</div><div className="shadow-card app-card"><h2>Positions</h2><div className="empty-state"><WalletCards size={34}/><h3>Nothing to show</h3><p>Connect your wallet to view private positions.</p></div></div></div></section>}

function NotFound(){return <section className="page container"><PageIntro kicker="404" title="Lost in the shadow." body="That page does not exist."/><Link className="primary-btn" to="/">Back home</Link></section>}

export default function App(){return <Layout><Routes><Route path="/" element={<Home/>}/><Route path="/swap" element={<SwapPage/>}/><Route path="/liquidity" element={<LiquidityPage/>}/><Route path="/portfolio" element={<PortfolioPage/>}/><Route path="*" element={<NotFound/>}/></Routes></Layout>}
