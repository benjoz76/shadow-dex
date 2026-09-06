// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IShadowFaucetToken {
    function transferFrom(address from, address to, suint256 amount) external returns (bool);
}

/// @title ShadowFaucet
/// @notice Testnet-only dual-token faucet for the Shadow-Dex learning environment.
/// @dev The token deployer must approve this contract on both TestSRC20 tokens.
contract ShadowFaucet {
    IShadowFaucetToken public immutable token0;
    IShadowFaucetToken public immutable token1;
    address public immutable treasury;

    uint256 public immutable CLAIM_AMOUNT0;
    uint256 public immutable CLAIM_AMOUNT1;
    uint256 public constant COOLDOWN = 1 days;

    mapping(address => uint256) public lastClaimAt;

    error CooldownActive(uint256 nextClaimAt);
    error InvalidConfiguration();
    error Token0TransferFailed();
    error Token1TransferFailed();

    constructor(
        address token0_,
        address token1_,
        uint256 claimAmount0_,
        uint256 claimAmount1_
    ) {
        if (
            token0_ == address(0) ||
            token1_ == address(0) ||
            token0_ == token1_ ||
            claimAmount0_ == 0 ||
            claimAmount1_ == 0
        ) revert InvalidConfiguration();

        token0 = IShadowFaucetToken(token0_);
        token1 = IShadowFaucetToken(token1_);
        treasury = msg.sender;
        CLAIM_AMOUNT0 = claimAmount0_;
        CLAIM_AMOUNT1 = claimAmount1_;
    }

    function claim() external {
        uint256 previousClaim = lastClaimAt[msg.sender];
        uint256 nextClaim = previousClaim + COOLDOWN;
        if (previousClaim != 0 && block.timestamp < nextClaim) {
            revert CooldownActive(nextClaim);
        }

        // Update before external calls. A reverted transfer also reverts this write.
        lastClaimAt[msg.sender] = block.timestamp;

        if (!token0.transferFrom(treasury, msg.sender, suint256(CLAIM_AMOUNT0))) {
            revert Token0TransferFailed();
        }
        if (!token1.transferFrom(treasury, msg.sender, suint256(CLAIM_AMOUNT1))) {
            revert Token1TransferFailed();
        }
    }

    function nextClaimAt(address account) external view returns (uint256) {
        uint256 previousClaim = lastClaimAt[account];
        return previousClaim == 0 ? 0 : previousClaim + COOLDOWN;
    }
}
