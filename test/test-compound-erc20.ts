import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { reset, impersonate } from "./utils";
import { WBTC, WBTC_WHALE, CWBTC } from "./config";
import { assert } from "chai";

const { time } = require("@openzeppelin/test-helpers");

const WBTC_DECIMALS = 8;
const DEPOSIT_AMOUNT = ethers.utils.parseUnits("1", WBTC_DECIMALS);

describe("TestCompoundErc20", () => {
  const WHALE = WBTC_WHALE;
  const TOKEN = WBTC;
  const C_TOKEN = CWBTC;

  let testCompound: Contract;
  let token: Contract;
  let cToken: Contract;
  let caller: Signer;
  let tokenWhaleSigner: Signer;
  beforeEach(async () => {
    await reset();

    [caller] = await ethers.getSigners();
    await caller.sendTransaction({ to: WHALE, value: ethers.utils.parseEther("1") });

    tokenWhaleSigner = await impersonate(WHALE);

    const TestCompound = await ethers.getContractFactory("TestCompoundErc20");
    testCompound = await TestCompound.deploy(TOKEN, C_TOKEN);
    await testCompound.deployed();

    token = await ethers.getContractAt("IERC20", TOKEN);
    cToken = await ethers.getContractAt("CErc20", C_TOKEN);

    const bal: BigNumber = await token.balanceOf(WHALE);
    console.log(`whale balance: ${bal}`);
    assert(bal.gte(DEPOSIT_AMOUNT), "bal < deposit");
  });

  const snapshot = async (testCompound: Contract, token: Contract, cToken: Contract) => {
    const { exchangeRate, supplyRate } = await testCompound.callStatic.getInfo();

    return {
      exchangeRate,
      supplyRate,
      estimateBalance: await testCompound.callStatic.estimateBalanceOfUnderlying(),
      balanceOfUnderlying: await testCompound.callStatic.balanceOfUnderlying(),
      token: await token.balanceOf(testCompound.address),
      cToken: await cToken.balanceOf(testCompound.address)
    };
  };

  it("should supply and redeem", async () => {
    await token.connect(tokenWhaleSigner)
      .approve(testCompound.address, DEPOSIT_AMOUNT, { from: WHALE });

    let tx = await testCompound.connect(tokenWhaleSigner)
      .supply(DEPOSIT_AMOUNT, {
        from: WHALE
      });

    await tx.wait();

    let after = await snapshot(testCompound, token, cToken);

    console.log("--- supply ---");
    console.log(`exchange rate ${after.exchangeRate}`);
    console.log(`supply rate ${after.supplyRate}`);
    console.log(`estimate balance ${after.estimateBalance}`);
    console.log(`balance of underlying ${after.balanceOfUnderlying}`);
    console.log(`token balance ${after.token}`);
    console.log(`c token balance ${after.cToken}`);

    // accrue interest on supply
    const block = await ethers.provider.getBlockNumber();
    await time.advanceBlockTo(block + 100);

    after = await snapshot(testCompound, token, cToken);

    console.log(`--- after some blocks... ---`);
    console.log(`balance of underlying ${after.balanceOfUnderlying}`);

    // test redeem
    const cTokenAmount = await cToken.balanceOf(testCompound.address);
    tx = await testCompound.connect(tokenWhaleSigner)
      .redeem(cTokenAmount, {
        from: WHALE
      });
    await tx.wait();

    after = await snapshot(testCompound, token, cToken);

    console.log(`--- redeem ---`);
    console.log(`balance of underlying ${after.balanceOfUnderlying}`);
    console.log(`token balance ${after.token}`);
    console.log(`c token balance ${after.cToken}`);
  });
});