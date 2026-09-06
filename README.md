# Shadow-Dex

Shadow-Dex is an experimental privacy-first AMM built for the Seismic testnet.

**Live app:** https://shadow-dex-zeta.vercel.app/

## Features

- Shielded swaps between sUSD and sETH
- Private liquidity positions
- Dual-token testnet faucet
- Wallet-authorized signed reads for private balances
- Seismic transaction support through `seismic-react` and `seismic-viem`

## Testnet contracts

| Contract | Address |
| --- | --- |
| Shadow USD (sUSD) | `0xe744F18e430084009918BFE307A384FCB7b165c1` |
| Shadow ETH (sETH) | `0xa9a612D444Bcf1F5c02Ff4dC65e86ADa31a1CE5f` |
| ShadowPool | `0xbbb7588c320e71C3f47a67B6ced3eE67DBCa1D68` |
| ShadowFaucet | `0xc5E8524cF438328a1d3c15c995cE0De154B50202` |

## Run locally

```bash
npm install
npm run dev
```

The frontend uses `https://testnet-2.seismictest.net/rpc` by default. Optional overrides are documented in `.env.example`.

## Disclaimer

Shadow-Dex is a testnet-only learning project. It has not been audited and must not be used with real funds.

## License

MIT
