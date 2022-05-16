import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { reset, impersonate } from "./utils";
import { USDC, USDC_WHALE } from "./config";
import { assert } from "chai";


describe("TestUniswapFlashSwap", async () => {
  const WHALE = USDC_WHALE;
  const TOKEN_BORROW = USDC;
  const DECIMALS = 6;
  const FUND_AMOUNT = ethers.utils.parseUnits("2000000", DECIMALS); //pow(10, DECIMALS).mul(new BN(2000000));
  const BORROW_AMOUNT = ethers.utils.parseUnits("1000000", DECIMALS); //pow(10, DECIMALS).mul(new BN(1000000));

  let testUniswapFlashSwap: Contract;
  let token: Contract;
  let caller: Signer;
  let tokenWhaleSigner: Signer;
  beforeEach(async () => {
    await reset();

    [caller] = await ethers.getSigners();
    await caller.sendTransaction({ to: WHALE, value: ethers.utils.parseEther("1") });

    tokenWhaleSigner = await impersonate(WHALE);

    token = await ethers.getContractAt("IERC20", TOKEN_BORROW);
    const TestUniswapFlashSwap = await ethers.getContractFactory("TestUniswapFlashSwap");
    testUniswapFlashSwap = await TestUniswapFlashSwap.deploy();
    await testUniswapFlashSwap.deployed();

    const bal: BigNumber = await token.balanceOf(WHALE);
    assert(bal.gte(FUND_AMOUNT), "balance < FUND");

    await token.connect(tokenWhaleSigner)
      .transfer(testUniswapFlashSwap.address, FUND_AMOUNT, {
        from: WHALE
      });
  });

  it("flash swap", async () => {
    console.log("USDC balance of testUniswapFlashSwap before flashSwap call: "
      + await token.balanceOf(testUniswapFlashSwap.address));

    const tx = await testUniswapFlashSwap
      .testFlashSwap(token.address, BORROW_AMOUNT);
    const receipt = await tx.wait();

    for (const log of receipt.events) {
      if (log.event == "Log") {
        const args = log.args;
        console.log(`${args.message}: ${args.val}`);
      }
    }

    console.log("USDC balance of testUniswapFlashSwap after flashSwap call: "
      + await token.balanceOf(testUniswapFlashSwap.address));
  });
});