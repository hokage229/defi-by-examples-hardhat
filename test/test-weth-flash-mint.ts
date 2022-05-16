import { ethers } from "hardhat";
import { Contract } from "ethers";
import { WETH_10 } from "./config";

describe.skip("TestWethFlashMint", () => {
  let testWethFlashMint: Contract;
  let weth: Contract;

  beforeEach(async () => {
    weth = await ethers.getContractAt("IERC20", WETH_10);

    const TestWethFlashMint = await ethers.getContractFactory("TestWethFlashMint");
    testWethFlashMint = await TestWethFlashMint.deploy();
    await testWethFlashMint.deployed();
  });

  it("flash", async () => {
    const tx = await testWethFlashMint.flash();
    const receipt = await tx.wait();

    console.log(`contract: ${await testWethFlashMint.address}`);
    console.log(`sender: ${await testWethFlashMint.sender()}`);
    console.log(`token: ${await testWethFlashMint.token()}`);

    for (const log of receipt.events) {
      if (log.event == "Log") {
        const args = log.args;
        console.log(`${args.message}: ${args.val}`);
      }
    }

    console.log("WETH10 balance of testUniswapFlashSwap after flashSwap call: "
      + await weth.balanceOf(testWethFlashMint.address));
  });
});