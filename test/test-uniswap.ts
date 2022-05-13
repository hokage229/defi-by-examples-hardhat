import { ethers, network } from "hardhat";
import { Contract, Signer } from "ethers";

const { DAI, WBTC, WBTC_WHALE } = require("./config");


const impersonate = async (address: string) => {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address]
  });
  return ethers.provider.getSigner(address);
};


const reset = async () => {
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: process.env.ALCHEMY_API,
          blockNumber: 14761751
        }
      }
    ]
  });
};

describe("TestUniswap", () => {
  const WHALE = WBTC_WHALE;
  const AMOUNT_IN = 100000000;
  const AMOUNT_OUT_MIN = 1;
  const TOKEN_IN = WBTC;
  const TOKEN_OUT = DAI;
  let CALLER: Signer;

  let testUniswap: Contract;
  let tokenIn: Contract;
  let tokenOut: Contract;
  beforeEach(async () => {
    [CALLER] = await ethers.getSigners();

    await reset();
    // console.log(CALLER.getAddress());
    // console.log(ethers.utils.formatEther(await ethers.provider.getBalance(WHALE)));
    // await CALLER.sendTransaction({ to: WHALE, value: ethers.utils.parseEther("2") });
    // console.log(ethers.utils.formatEther(await ethers.provider.getBalance(WHALE)));

    tokenIn = await ethers.getContractAt("IERC20", TOKEN_IN);
    tokenOut = await ethers.getContractAt("IERC20", TOKEN_OUT);

    const TestUniswap = await ethers.getContractFactory("TestUniswap");
    testUniswap = await TestUniswap.deploy();
    await testUniswap.deployed();

    let token_whale_signer = await impersonate(WHALE);
    await tokenIn.connect(token_whale_signer)
      .approve(testUniswap.address, AMOUNT_IN, { from: WHALE });
  });

  it("should pass", async () => {
    const allowed = await tokenIn.allowance(WHALE, testUniswap.address);
    console.log(`tokenIn allowed to spend (to uniswap): ${allowed}`);

    const balance = await tokenIn.balanceOf(WHALE);
    console.log(`tokenIn balance of whale ${balance}`);

    console.log(`tokenOut balance before swap ${await tokenOut.balanceOf(CALLER.getAddress())}`);

    let token_whale_signer = await impersonate(WHALE);
    // await tokenIn.connect(token_whale_signer).transfer(testUniswap.address, AMOUNT_IN, { from: WHALE });
    await testUniswap.connect(token_whale_signer).swap(
      tokenIn.address,
      tokenOut.address,
      AMOUNT_IN,
      AMOUNT_OUT_MIN,
      CALLER.getAddress(),
      {
        from: WHALE
      }
    );

    console.log(`tokenOut balance after swap ${await tokenOut.balanceOf(CALLER.getAddress())}`);
  });
});
