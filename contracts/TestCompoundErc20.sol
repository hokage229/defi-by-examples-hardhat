// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/Compound.sol";

contract TestCompoundErc20 {
    IERC20 public token;
    CErc20 public cToken;

    constructor(address _token, address _cToken) {
        token = IERC20(_token);
        cToken = CErc20(_cToken);
    }

    function supply(uint256 _amount) external {
        token.transferFrom(msg.sender, address(this), _amount);
        token.approve(address(cToken), _amount);
        require(cToken.mint(_amount) == 0, "mint failed");
    }

    function getCTokenBalance() external view returns (uint256) {
        return cToken.balanceOf(address(this));
    }

    function getInfo()
        external
        returns (uint256 exchangeRate, uint256 supplyRate)
    {
        exchangeRate = cToken.exchangeRateCurrent();
        supplyRate = cToken.supplyRatePerBlock();
    }

    function estimateBalanceOfUnderlying() external returns (uint256) {
        uint256 cTokenBal = cToken.balanceOf(address(this));
        uint256 exchangeRate = cToken.exchangeRateCurrent();
        uint256 decimals = 8; //WBTC = 8 decimals
        uint256 cTokenDecimals = 8;

        return
            (cTokenBal * exchangeRate) / 10**(18 + decimals - cTokenDecimals);
    }

    function balanceOfUnderlying() external returns (uint256) {
        return cToken.balanceOfUnderlying(address(this));
    }

    function redeem(uint256 _cTokenAmount) external {
        require(cToken.redeem(_cTokenAmount) == 0, "redeem failed");
    }
}
