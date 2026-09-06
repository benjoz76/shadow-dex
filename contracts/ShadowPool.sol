// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/// @notice Minimal interface for Seismic SRC20-style shielded tokens.
interface IShieldedToken {
    function transfer(address to, suint256 amount) external returns (bool);
    function transferFrom(address from, address to, suint256 amount) external returns (bool);
}

/// @title ShadowPool
/// @notice Experimental two-token confidential AMM for Seismic.
/// @dev Must be compiled with the Seismic Solidity toolchain (ssolc/sforge), not stock solc.
///      Reserves, swap amounts, and LP balances use shielded integers.
contract ShadowPool {
    IShieldedToken public immutable token0;
    IShieldedToken public immutable token1;

    suint256 private reserve0;
    suint256 private reserve1;
    suint256 private totalLiquidity;
    mapping(address => suint256) private liquidity;

    constructor(address _token0, address _token1) {
        require(_token0 != address(0) && _token1 != address(0), "zero token");
        require(_token0 != _token1, "same token");
        token0 = IShieldedToken(_token0);
        token1 = IShieldedToken(_token1);
    }

    /// @notice Adds liquidity while keeping supplied amounts and LP balance shielded.
    function addLiquidity(suint256 amount0, suint256 amount1) external {
        suint256 shares;
        if (totalLiquidity == suint256(0)) {
            shares = amount0;
        } else {
            suint256 shares0 = (amount0 * totalLiquidity) / reserve0;
            suint256 shares1 = (amount1 * totalLiquidity) / reserve1;
            shares = shares0 < shares1 ? shares0 : shares1;
        }

        liquidity[msg.sender] += shares;
        totalLiquidity += shares;
        reserve0 += amount0;
        reserve1 += amount1;

        require(token0.transferFrom(msg.sender, address(this), amount0), "token0 transfer failed");
        require(token1.transferFrom(msg.sender, address(this), amount1), "token1 transfer failed");
    }

    /// @notice Removes a shielded LP share and returns both underlying assets.
    function removeLiquidity(suint256 shares) external {
        suint256 base = totalLiquidity;
        suint256 amount0 = (shares * reserve0) / base;
        suint256 amount1 = (shares * reserve1) / base;

        liquidity[msg.sender] -= shares;
        totalLiquidity -= shares;
        reserve0 -= amount0;
        reserve1 -= amount1;

        require(token0.transfer(msg.sender, amount0), "token0 transfer failed");
        require(token1.transfer(msg.sender, amount1), "token1 transfer failed");
    }

    /// @notice Direction-hiding wrapper: callers submit both shielded inputs, normally one is zero.
    function swap(suint256 token0In, suint256 token1In) external {
        (suint256 token1Out, suint256 newReserve0, suint256 newReserve1) =
            _swap(token0, token1, reserve0, reserve1, token0In);
        reserve0 = newReserve0;
        reserve1 = newReserve1;

        (suint256 token0Out, suint256 finalReserve1, suint256 finalReserve0) =
            _swap(token1, token0, reserve1, reserve0, token1In);
        reserve1 = finalReserve1;
        reserve0 = finalReserve0;

        token0Out;
        token1Out;
    }

    function _swap(
        IShieldedToken tokenIn,
        IShieldedToken tokenOut,
        suint256 reserveIn,
        suint256 reserveOut,
        suint256 amountIn
    ) internal returns (suint256 amountOut, suint256 reserveInNew, suint256 reserveOutNew) {
        amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
        reserveInNew = reserveIn + amountIn;
        reserveOutNew = reserveOut - amountOut;

        require(tokenIn.transferFrom(msg.sender, address(this), amountIn), "input transfer failed");
        require(tokenOut.transfer(msg.sender, amountOut), "output transfer failed");
    }

    /// @notice Signed/private read target for the connected user.
    function myLiquidity() external view returns (uint256) {
        return uint256(liquidity[msg.sender]);
    }
}
