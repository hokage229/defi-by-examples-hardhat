import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { reset, impersonate } from "./utils";
import { USDC, USDC_WHALE } from "./config";
import { assert } from "chai";


const SOLO = "0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e";

describe.skip("TestDyDxSoloMargin", async () => {
  const WHALE = USDC_WHALE;
  const TOKEN = USDC;
  const DECIMALS = 6;
  const FUND_AMOUNT = ethers.utils.parseUnits("2000000", DECIMALS);
  const BORROW_AMOUNT = ethers.utils.parseUnits("1000000", DECIMALS);

  let testDyDxSoloMargin: Contract;
  let token: Contract;
  let caller: Signer;
  let tokenWhaleSigner: Signer;
  beforeEach(async () => {
    await reset();

    [caller] = await ethers.getSigners();
    await caller.sendTransaction({ to: WHALE, value: ethers.utils.parseEther("1") });

    tokenWhaleSigner = await impersonate(WHALE);

    token = await ethers.getContractAt("IERC20", TOKEN);
    const TestDyDxSoloMargin = await ethers.getContractFactory("TestDyDxSoloMargin");
    testDyDxSoloMargin = await TestDyDxSoloMargin.deploy();
    await testDyDxSoloMargin.deployed();

    // send enough token to cover flash loan fee
    const bal: BigNumber = await token.balanceOf(WHALE);
    assert(bal.gte(FUND_AMOUNT), "balance < fund");
    await token.connect(tokenWhaleSigner).transfer(testDyDxSoloMargin.address, FUND_AMOUNT, {
      from: WHALE
    });

    const soloBal = await token.balanceOf(SOLO);
    console.log(`solo balance: ${soloBal}`);
    assert(soloBal.gte(BORROW_AMOUNT), "solo < borrow");
  });

  it("flash loan", async () => {
    console.log("USDC balance of testUniswapFlashSwap before flashSwap call: "
      + await token.balanceOf(testDyDxSoloMargin.address));


    const tx = await testDyDxSoloMargin.connect(tokenWhaleSigner)
      .initiateFlashLoan(token.address, BORROW_AMOUNT, {
        from: WHALE
      });
    const receipt = await tx.wait();

    console.log(`${await testDyDxSoloMargin.flashUser()}`);

    for (const log of receipt.events) {
      if (log.event == "Log") {
        const args = log.args;
        console.log(`${args.message}: ${args.val}`);
      }
    }

    console.log("USDC balance of testUniswapFlashSwap after flashSwap call: "
      + await token.balanceOf(testDyDxSoloMargin.address));
  });
});