import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { reset, impersonate } from "./utils";
import { WETH, DAI, WETH_WHALE, DAI_WHALE } from "./config";

describe("TestUniswapLiquidity", () => {
  let CALLER: Signer;
  const TOKEN_A = WETH;
  const TOKEN_A_WHALE = WETH_WHALE;
  const TOKEN_B = DAI;
  const TOKEN_B_WHALE = DAI_WHALE;
  const TOKEN_A_AMOUNT = ethers.utils.parseEther("1");
  const TOKEN_B_AMOUNT = ethers.utils.parseEther("2000");


  let testUniswapLiquidity: Contract;
  let tokenA: Contract;
  let tokenB: Contract;
  beforeEach(async () => {
    await reset();

    [CALLER] = await ethers.getSigners();

    tokenA = await ethers.getContractAt("IERC20", TOKEN_A);
    tokenB = await ethers.getContractAt("IERC20", TOKEN_B);

    const TestUniswapLiquidity = await ethers.getContractFactory("TestUniswapLiquidity");
    testUniswapLiquidity = await TestUniswapLiquidity.deploy();
    await testUniswapLiquidity.deployed();

    // send ETH to cover tx fee
    // await sendEther(web3, accounts[0], TOKEN_A_WHALE, 1);
    // await sendEther(web3, accounts[0], TOKEN_B_WHALE, 1);

    let token_whale_signer_A = await impersonate(TOKEN_A_WHALE);
    await tokenA.connect(token_whale_signer_A)
      .transfer(CALLER.getAddress(), TOKEN_A_AMOUNT, { from: TOKEN_A_WHALE });

    let token_whale_signer_B = await impersonate(TOKEN_B_WHALE);
    await tokenB.connect(token_whale_signer_B)
      .transfer(CALLER.getAddress(), TOKEN_B_AMOUNT, { from: TOKEN_B_WHALE });

    await tokenA.approve(testUniswapLiquidity.address, TOKEN_A_AMOUNT);
    await tokenB.approve(testUniswapLiquidity.address, TOKEN_B_AMOUNT);

    console.log(`TokenA.
      Balance:          ${await tokenA.balanceOf(CALLER.getAddress())}
      Allowed to spend: ${await tokenA.allowance(CALLER.getAddress(), testUniswapLiquidity.address)}`);

    console.log(`TokenB.
      Balance:          ${await tokenB.balanceOf(CALLER.getAddress())}
      Allowed to spend: ${await tokenB.allowance(CALLER.getAddress(), testUniswapLiquidity.address)}`);
  });

  it("add liquidity and remove liquidity", async () => {
    let tx = await testUniswapLiquidity.addLiquidity(
      tokenA.address,
      tokenB.address,
      TOKEN_A_AMOUNT,
      TOKEN_B_AMOUNT
    );
    let receipt = await tx.wait();
    console.log("=== add liquidity ===");
    for (const log of receipt.events) {
      if (log.event == "Log") {
        const args = log.args;
        console.log(`${args.message}: ${args.val}`);
      }
    }

    tx = await testUniswapLiquidity.removeLiquidity(tokenA.address, tokenB.address);
    receipt = await tx.wait();
    console.log("=== remove liquidity ===");
    for (const log of receipt.events) {
      if (log.event == "Log") {
        const args = log.args;
        console.log(`${args.message}: ${args.val}`);
      }
    }
  });
});