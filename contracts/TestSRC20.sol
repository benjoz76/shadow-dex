// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/// @title TestSRC20
/// @notice Minimal Seismic-native test token for Shadow-Dex development.
/// @dev Uses shielded balances, allowances, and transfer amounts.
///      Mapping keys remain ordinary addresses; shielded values are stored privately.
///      Compile with Seismic Foundry (sforge/ssolc), not stock Solidity.
contract TestSRC20 {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public immutable owner;

    mapping(address => suint256) private balances;
    mapping(address => mapping(address => suint256)) private allowances;

    error Unauthorized();
    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();

    constructor(string memory name_, string memory symbol_, uint256 initialSupply) {
        name = name_;
        symbol = symbol_;
        owner = msg.sender;
        _mint(msg.sender, suint256(initialSupply));
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    /// @notice Test-only mint path. Amount is transparent by design for easy bootstrapping.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, suint256(amount));
    }

    /// @notice Private balance read for the caller. Intended to be invoked as a signed read.
    function myBalance() external view returns (uint256) {
        return uint256(balances[msg.sender]);
    }

    function balanceOf(address account) external view returns (uint256) {
        if (account != msg.sender) revert Unauthorized();
        return uint256(balances[account]);
    }

    function allowance(address tokenOwner, address spender) external view returns (uint256) {
        if (msg.sender != tokenOwner && msg.sender != spender) revert Unauthorized();
        return uint256(allowances[tokenOwner][spender]);
    }

    function approve(address spender, suint256 amount) external returns (bool) {
        if (spender == address(0)) revert ZeroAddress();
        allowances[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, suint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, suint256 amount) external returns (bool) {
        suint256 currentAllowance = allowances[from][msg.sender];
        if (currentAllowance < amount) revert InsufficientAllowance();
        unchecked {
            allowances[from][msg.sender] = currentAllowance - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, suint256 amount) internal {
        if (to == address(0)) revert ZeroAddress();
        suint256 fromBalance = balances[from];
        if (fromBalance < amount) revert InsufficientBalance();
        unchecked {
            balances[from] = fromBalance - amount;
            balances[to] += amount;
        }
    }

    function _mint(address to, suint256 amount) internal {
        if (to == address(0)) revert ZeroAddress();
        balances[to] += amount;
        totalSupply += uint256(amount);
    }
}
