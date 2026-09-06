// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/// @title TestSRC20
/// @notice Minimal Seismic-native test token for Shadow-Dex development.
/// @dev Uses shielded balances, allowances, recipients, and transfer amounts.
///      Compile with Seismic Foundry (sforge/ssolc), not stock Solidity.
contract TestSRC20 {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public immutable owner;

    mapping(saddress => suint256) private balances;
    mapping(saddress => mapping(saddress => suint256)) private allowances;

    error Unauthorized();
    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();

    constructor(string memory name_, string memory symbol_, uint256 initialSupply) {
        name = name_;
        symbol = symbol_;
        owner = msg.sender;
        _mint(saddress(msg.sender), suint256(initialSupply));
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    /// @notice Test-only mint path. Amount is transparent by design for easy bootstrapping.
    function mint(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        _mint(saddress(to), suint256(amount));
    }

    /// @notice Private balance read for the caller. Intended to be invoked as a signed read.
    function myBalance() external view returns (uint256) {
        return uint256(balances[saddress(msg.sender)]);
    }

    /// @notice Owner-only balance read pattern matching common SRC20 semantics.
    function balanceOf(saddress account) external view returns (uint256) {
        if (account != saddress(msg.sender)) revert Unauthorized();
        return uint256(balances[account]);
    }

    function allowance(saddress tokenOwner, saddress spender) external view returns (uint256) {
        saddress caller = saddress(msg.sender);
        if (caller != tokenOwner && caller != spender) revert Unauthorized();
        return uint256(allowances[tokenOwner][spender]);
    }

    function approve(saddress spender, suint256 amount) external returns (bool) {
        if (spender == saddress(address(0))) revert ZeroAddress();
        allowances[saddress(msg.sender)][spender] = amount;
        return true;
    }

    function transfer(saddress to, suint256 amount) external returns (bool) {
        _transfer(saddress(msg.sender), to, amount);
        return true;
    }

    function transferFrom(saddress from, saddress to, suint256 amount) external returns (bool) {
        saddress spender = saddress(msg.sender);
        suint256 currentAllowance = allowances[from][spender];
        if (currentAllowance < amount) revert InsufficientAllowance();

        unchecked {
            allowances[from][spender] = currentAllowance - amount;
        }

        _transfer(from, to, amount);
        return true;
    }

    function _transfer(saddress from, saddress to, suint256 amount) internal {
        if (to == saddress(address(0))) revert ZeroAddress();

        suint256 fromBalance = balances[from];
        if (fromBalance < amount) revert InsufficientBalance();

        unchecked {
            balances[from] = fromBalance - amount;
            balances[to] += amount;
        }
    }

    function _mint(saddress to, suint256 amount) internal {
        if (to == saddress(address(0))) revert ZeroAddress();
        balances[to] += amount;
        totalSupply += uint256(amount);
    }
}
