#!/usr/bin/env bash
set -euo pipefail

: "${SEISMIC_RPC_URL:?SEISMIC_RPC_URL is required}"
: "${PRIVATE_KEY:?PRIVATE_KEY is required}"

TOKEN0_ADDRESS="${TOKEN0_ADDRESS:-0xe744F18e430084009918BFE307A384FCB7b165c1}"
TOKEN1_ADDRESS="${TOKEN1_ADDRESS:-0xa9a612D444Bcf1F5c02Ff4dC65e86ADa31a1CE5f}"
CLAIM_AMOUNT0="${CLAIM_AMOUNT0:-100000000000000000000}"
CLAIM_AMOUNT1="${CLAIM_AMOUNT1:-100000000000000000000}"
FAUCET_ALLOWANCE="${FAUCET_ALLOWANCE:-1000000000000000000000000}"
DEPLOY_GAS_LIMIT="${DEPLOY_GAS_LIMIT:-5000000}"
TX_GAS_LIMIT="${TX_GAS_LIMIT:-1500000}"

command -v sforge >/dev/null 2>&1 || { echo "sforge not found. Install Seismic Foundry with sfoundryup." >&2; exit 1; }
command -v scast >/dev/null 2>&1 || { echo "scast not found. Install Seismic Foundry with sfoundryup." >&2; exit 1; }

printf '\n==> Building ShadowFaucet\n'
sforge build

printf '\n==> Deploying ShadowFaucet\n'
FAUCET_OUTPUT=$(sforge create contracts/ShadowFaucet.sol:ShadowFaucet \
  --rpc-url "$SEISMIC_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --gas-limit "$DEPLOY_GAS_LIMIT" \
  --constructor-args "$TOKEN0_ADDRESS" "$TOKEN1_ADDRESS" "$CLAIM_AMOUNT0" "$CLAIM_AMOUNT1")
echo "$FAUCET_OUTPUT"

FAUCET_ADDRESS=$(printf '%s\n' "$FAUCET_OUTPUT" | sed -n 's/.*Deployed to: \(0x[0-9a-fA-F]*\).*/\1/p' | tail -n1)
if [[ -z "$FAUCET_ADDRESS" ]]; then
  echo "Could not parse ShadowFaucet deployment address." >&2
  exit 1
fi

approve_faucet() {
  local token="$1"
  printf '\n==> Approving faucet on %s\n' "$token"
  scast send "$token" "approve(address,suint256)" "$FAUCET_ADDRESS" "$FAUCET_ALLOWANCE" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$SEISMIC_RPC_URL" \
    --seismic \
    --gas-limit "$TX_GAS_LIMIT"
}

approve_faucet "$TOKEN0_ADDRESS"
approve_faucet "$TOKEN1_ADDRESS"

cat <<EOF

ShadowFaucet ready ✅
FAUCET=$FAUCET_ADDRESS

Frontend env:
VITE_FAUCET_ADDRESS=$FAUCET_ADDRESS
EOF
