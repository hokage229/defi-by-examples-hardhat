import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { reset, impersonate } from "./utils";
import { USDC, USDC_WHALE } from "./config";
import { assert } from "chai";

describe.skip("TestAaveFlashLoan", () => {
  const WHALE = USDC_WHALE;
  const TOKEN_BORROW = USDC;
  const DECIMALS = 6;
  const FUND_AMOUNT = ethers.utils.parseUnits("2000", DECIMALS);
  const BORROW_AMOUNT = ethers.utils.parseUnits("1000", DECIMALS);
  const ADDRESS_PROVIDER = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5";

  let testAaveFlashLoan: Contract;
  let token: Contract;
  beforeEach(async () => {
    await reset();
    const [CALLER] = await ethers.getSigners();

    token = await ethers.getContractAt("IERC20", TOKEN_BORROW);
    const TestAaveFlashLoan = await ethers.getContractFactory("TestAaveFlashLoan");
    testAaveFlashLoan = await TestAaveFlashLoan.deploy(ADDRESS_PROVIDER);
    await testAaveFlashLoan.deployed();

    await CALLER.sendTransaction({ to: WHALE, value: ethers.utils.parseEther("2") });

    // send enough token to cover fee
    const bal: BigNumber = await token.balanceOf(WHALE);
    // console.log(`balance: ${bal}`);
    assert(bal.gte(FUND_AMOUNT), "balance < FUND");

    const token_whale_signer = await impersonate(WHALE);
    await token.connect(token_whale_signer).transfer(testAaveFlashLoan.address, FUND_AMOUNT, {
      from: WHALE
    });
  });

  it("flash loan", async () => {
    const token_whale_signer = await impersonate(WHALE);
    const tx = await testAaveFlashLoan.connect(token_whale_signer).testFlashLoan(token.address, BORROW_AMOUNT, {
      from: WHALE
    });
    const receipt = await tx.wait();
    for (const log of receipt.events) {
      if (log.event == "Log") {
        const args = log.args;
        console.log(`${args.message}: ${args.val}`);
      }
    }
  });
});