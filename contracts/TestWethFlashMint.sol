// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/WETH10.sol";

contract TestWethFlashMint {
    // WETH 10
    address private WETH = 0xf4BB2e28688e89fCcE3c0580D37d36A7672E8A9F;
    bytes32 public immutable CALLBACK_SUCCESS =
        keccak256("ERC3156FlashBorrower.onFlashLoan");

    address public sender;
    address public token;

    event Log(string message, uint256 val);

    function flash() external {
        uint256 total = IERC20(WETH).totalSupply();
        emit Log("total supply", total);

        uint256 amount = total + 1;
        IERC20(WETH).approve(WETH, amount);

        bytes memory data = "";

        WETH10(WETH).flashLoan(address(this), WETH, amount, data);
    }

    function onFlashLoan(
        address _sender,
        address _token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bytes32) {
        // do stuff here

        sender = _sender;
        token = _token;

        uint256 bal = IERC20(WETH).balanceOf(address(this));

        emit Log("amount", amount);
        emit Log("fee", fee);
        emit Log("balance", bal);

        return CALLBACK_SUCCESS;
    }
}
