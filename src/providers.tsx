import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { ShieldedWalletProvider } from 'seismic-react'
import { seismicTestnet } from 'seismic-react/rainbowkit'
import { http as viemHttp } from 'viem'
import { WagmiProvider, createConfig, http as wagmiHttp, injected } from 'wagmi'

const defaultRpcUrl = 'https://testnet-2.seismictest.net/rpc'
const rpcUrl = String(import.meta.env.VITE_RPC_URL || defaultRpcUrl).trim()

export const shadowChain = {
  ...seismicTestnet,
  nativeCurrency: { decimals: 18, name: 'Seismic', symbol: 'SIZE' },
  // Seismic currently targets 500 ms blocks. Supplying this prevents viem
  // from retaining latest-block reads for its generic 4 second default.
  blockTime: 500,
  rpcUrls: {
    ...seismicTestnet.rpcUrls,
    default: { ...seismicTestnet.rpcUrls.default, http: [rpcUrl] },
    public: { ...seismicTestnet.rpcUrls.public, http: [rpcUrl] },
  },
}

export const wagmiConfig = createConfig({
  chains: [shadowChain],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [shadowChain.id]: wagmiHttp(rpcUrl),
  },
})

const publicTransport = viemHttp(rpcUrl)
const queryClient = new QueryClient()

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ShieldedWalletProvider
            config={wagmiConfig}
            options={{ publicTransport, publicChain: shadowChain }}
          >
            {children}
          </ShieldedWalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
