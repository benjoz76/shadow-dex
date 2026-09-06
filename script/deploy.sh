#!/usr/bin/env bash
set -euo pipefail

: "${SEISMIC_RPC_URL:?SEISMIC_RPC_URL is required}"
: "${PRIVATE_KEY:?PRIVATE_KEY is required}"

INITIAL_SUPPLY="${INITIAL_SUPPLY:-1000000000000000000000000}"
TOKEN0_NAME="${TOKEN0_NAME:-Shadow USD}"
TOKEN0_SYMBOL="${TOKEN0_SYMBOL:-sUSD}"
TOKEN1_NAME="${TOKEN1_NAME:-Shadow ETH}"
TOKEN1_SYMBOL="${TOKEN1_SYMBOL:-sETH}"
DEPLOY_GAS_LIMIT="${DEPLOY_GAS_LIMIT:-5000000}"

command -v sforge >/dev/null 2>&1 || { echo "sforge not found. Install Seismic Foundry with sfoundryup." >&2; exit 1; }

printf '\n==> Building contracts with Seismic Foundry\n'
sforge build

extract_address() {
  sed -n 's/.*Deployed to: \(0x[0-9a-fA-F]*\).*/\1/p' | tail -n1
}

# Seismic signed gas estimation can currently fail with `signed read missing seismic_elements`.
# If Foundry falls back to unsigned estimation, `msg.sender` is effectively unavailable/zeroed
# during estimation. TestSRC20 intentionally rejects zero-address minting in its constructor,
# so unsigned estimation reverts with ZeroAddress(). Supplying an explicit gas limit avoids
# that incorrect estimation path while preserving the real signed deployment transaction.
CREATE_COMMON=(
  --rpc-url "$SEISMIC_RPC_URL"
  --private-key "$PRIVATE_KEY"
  --broadcast
  --gas-limit "$DEPLOY_GAS_LIMIT"
)

printf '\n==> Deploying %s (%s)\n' "$TOKEN0_NAME" "$TOKEN0_SYMBOL"
TOKEN0_OUTPUT=$(sforge create contracts/TestSRC20.sol:TestSRC20 \
  "${CREATE_COMMON[@]}" \
  --constructor-args "$TOKEN0_NAME" "$TOKEN0_SYMBOL" "$INITIAL_SUPPLY")
echo "$TOKEN0_OUTPUT"
TOKEN0_ADDRESS=$(printf '%s\n' "$TOKEN0_OUTPUT" | extract_address)

printf '\n==> Deploying %s (%s)\n' "$TOKEN1_NAME" "$TOKEN1_SYMBOL"
TOKEN1_OUTPUT=$(sforge create contracts/TestSRC20.sol:TestSRC20 \
  "${CREATE_COMMON[@]}" \
  --constructor-args "$TOKEN1_NAME" "$TOKEN1_SYMBOL" "$INITIAL_SUPPLY")
echo "$TOKEN1_OUTPUT"
TOKEN1_ADDRESS=$(printf '%s\n' "$TOKEN1_OUTPUT" | extract_address)

if [[ -z "$TOKEN0_ADDRESS" || -z "$TOKEN1_ADDRESS" ]]; then
  echo "Could not parse token deployment addresses; inspect the sforge output above." >&2
  exit 1
fi

printf '\n==> Deploying ShadowPool\n'
POOL_OUTPUT=$(sforge create contracts/ShadowPool.sol:ShadowPool \
  "${CREATE_COMMON[@]}" \
  --constructor-args "$TOKEN0_ADDRESS" "$TOKEN1_ADDRESS")
echo "$POOL_OUTPUT"
POOL_ADDRESS=$(printf '%s\n' "$POOL_OUTPUT" | extract_address)

if [[ -z "$POOL_ADDRESS" ]]; then
  echo "Could not parse ShadowPool deployment address; inspect the sforge output above." >&2
  exit 1
fi

cat <<EOF

Deployment complete ✅
TOKEN0=$TOKEN0_ADDRESS
TOKEN1=$TOKEN1_ADDRESS
SHADOW_POOL=$POOL_ADDRESS

Frontend env:
VITE_TOKEN0_ADDRESS=$TOKEN0_ADDRESS
VITE_TOKEN1_ADDRESS=$TOKEN1_ADDRESS
VITE_SHADOW_POOL_ADDRESS=$POOL_ADDRESS
EOF
