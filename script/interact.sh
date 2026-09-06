#!/usr/bin/env bash
set -euo pipefail

# Shadow-Dex interaction helper for Seismic testnet.
# Uses scast --seismic so suint256 calldata is encrypted client-side.
# Required env:
#   PRIVATE_KEY
#   SEISMIC_RPC_URL
# Optional env overrides:
#   TOKEN0_ADDRESS, TOKEN1_ADDRESS, SHADOW_POOL_ADDRESS
#   TX_GAS_LIMIT
#
# Default deployed testnet addresses below are the current Shadow-Dex MVP deployment.

: "${PRIVATE_KEY:?PRIVATE_KEY is required}"
: "${SEISMIC_RPC_URL:?SEISMIC_RPC_URL is required}"

TOKEN0_ADDRESS="${TOKEN0_ADDRESS:-0xe744F18e430084009918BFE307A384FCB7b165c1}"
TOKEN1_ADDRESS="${TOKEN1_ADDRESS:-0x05e16300b3392b2e61C20Ca3ff34E358523A2B00}"
SHADOW_POOL_ADDRESS="${SHADOW_POOL_ADDRESS:-0x4ce3ab8A4a64Cff6Aa0b4D364f985EDeE1BE08b6}"
TX_GAS_LIMIT="${TX_GAS_LIMIT:-1500000}"

command -v scast >/dev/null 2>&1 || {
  echo "scast not found. Install Seismic Foundry with sfoundryup." >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage:
  ./script/interact.sh approve <token0|token1|both> <amount>
  ./script/interact.sh add-liquidity <amount0> <amount1>
  ./script/interact.sh swap <0to1|1to0> <amount>
  ./script/interact.sh remove-liquidity <shares>
  ./script/interact.sh bootstrap <amount0> <amount1>

Amounts use raw token units (18 decimals for TestSRC20).
Examples:
  1 token   = 1000000000000000000
  10 tokens = 10000000000000000000

Examples:
  ./script/interact.sh approve both 100000000000000000000
  ./script/interact.sh add-liquidity 100000000000000000000 100000000000000000000
  ./script/interact.sh swap 0to1 1000000000000000000
  ./script/interact.sh remove-liquidity 1000000000000000000

bootstrap runs:
  approve token0 -> approve token1 -> addLiquidity
and stops immediately if any transaction reverts.
EOF
}

send_seismic() {
  local to="$1"
  local sig="$2"
  shift 2

  echo
  echo "==> $sig"

  local receipt
  receipt=$(scast send "$to" "$sig" "$@" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$SEISMIC_RPC_URL" \
    --seismic \
    --gas-limit "$TX_GAS_LIMIT" \
    --json)

  echo "$receipt"

  # scast can return exit code 0 even when the mined transaction reverted,
  # so explicitly inspect receipt.status before continuing a multi-step flow.
  if ! printf '%s' "$receipt" | grep -Eq '"status"[[:space:]]*:[[:space:]]*"0x1"'; then
    echo "ERROR: $sig reverted (receipt status != 0x1). Stopping flow." >&2
    return 1
  fi
}

approve_token() {
  local token="$1"
  local amount="$2"
  send_seismic "$token" "approve(address,suint256)" "$SHADOW_POOL_ADDRESS" "$amount"
}

approve() {
  local which="${1:-}"
  local amount="${2:-}"

  [[ -n "$which" && -n "$amount" ]] || { usage; exit 1; }

  case "$which" in
    token0)
      approve_token "$TOKEN0_ADDRESS" "$amount"
      ;;
    token1)
      approve_token "$TOKEN1_ADDRESS" "$amount"
      ;;
    both)
      approve_token "$TOKEN0_ADDRESS" "$amount"
      approve_token "$TOKEN1_ADDRESS" "$amount"
      ;;
    *)
      echo "Unknown token selector: $which" >&2
      usage
      exit 1
      ;;
  esac
}

add_liquidity() {
  local amount0="${1:-}"
  local amount1="${2:-}"
  [[ -n "$amount0" && -n "$amount1" ]] || { usage; exit 1; }

  send_seismic "$SHADOW_POOL_ADDRESS" \
    "addLiquidity(suint256,suint256)" \
    "$amount0" "$amount1"
}

swap() {
  local direction="${1:-}"
  local amount="${2:-}"
  [[ -n "$direction" && -n "$amount" ]] || { usage; exit 1; }

  case "$direction" in
    0to1)
      send_seismic "$SHADOW_POOL_ADDRESS" \
        "swap(suint256,suint256)" \
        "$amount" "0"
      ;;
    1to0)
      send_seismic "$SHADOW_POOL_ADDRESS" \
        "swap(suint256,suint256)" \
        "0" "$amount"
      ;;
    *)
      echo "Unknown swap direction: $direction" >&2
      usage
      exit 1
      ;;
  esac
}

remove_liquidity() {
  local shares="${1:-}"
  [[ -n "$shares" ]] || { usage; exit 1; }

  send_seismic "$SHADOW_POOL_ADDRESS" \
    "removeLiquidity(suint256)" \
    "$shares"
}

bootstrap() {
  local amount0="${1:-}"
  local amount1="${2:-}"
  [[ -n "$amount0" && -n "$amount1" ]] || { usage; exit 1; }

  echo "==> Approving token0"
  approve_token "$TOKEN0_ADDRESS" "$amount0"

  echo "==> Approving token1"
  approve_token "$TOKEN1_ADDRESS" "$amount1"

  echo "==> Adding liquidity"
  add_liquidity "$amount0" "$amount1"
}

cmd="${1:-}"
shift || true

case "$cmd" in
  approve)
    approve "$@"
    ;;
  add-liquidity)
    add_liquidity "$@"
    ;;
  swap)
    swap "$@"
    ;;
  remove-liquidity)
    remove_liquidity "$@"
    ;;
  bootstrap)
    bootstrap "$@"
    ;;
  -h|--help|help|"")
    usage
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    usage
    exit 1
    ;;
esac
