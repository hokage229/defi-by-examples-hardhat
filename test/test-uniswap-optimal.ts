import { ethers } from "hardhat";
import { Contract} from "ethers";
import { reset, impersonate } from "./utils";
import { WETH, DAI, DAI_WHALE} from "./config";

describe.skip("TestUniswapOptimal", () => {
  const WHALE = DAI_WHALE;
  const AMOUNT = ethers.utils.parseEther("1000");

  let testUniswapOptimal: Contract;
  let fromToken: Contract;
  let toToken: Contract;
  let pair: Contract;
  beforeEach(async () => {
    await reset();

    fromToken = await ethers.getContractAt("IERC20", DAI);
    toToken = await ethers.getContractAt("IERC20", WETH);

    const TestUniswapOptimal = await ethers.getContractFactory("TestUniswapOptimal");
    testUniswapOptimal = await TestUniswapOptimal.deploy();
    await testUniswapOptimal.deployed();

    pair = await ethers.getContractAt("IERC20",
      await testUniswapOptimal.getPair(fromToken.address, toToken.address));

    // await sendEther(web3, accounts[0], WHALE, 1);
    let token_whale_signer = await impersonate(WHALE);
    await fromToken.connect(token_whale_signer)
      .approve(testUniswapOptimal.address, AMOUNT, { from: WHALE });

    console.log(`fromToken(DAI).
      Balance of WHALE: ${await fromToken.balanceOf(WHALE)}
      Allowed to spend: ${await fromToken.allowance(WHALE, testUniswapOptimal.address)}`);
  });

  const snapshot = async () => {
    return {
      lp: await pair.balanceOf(testUniswapOptimal.address),
      fromToken: await fromToken.balanceOf(testUniswapOptimal.address),
      toToken: await toToken.balanceOf(testUniswapOptimal.address)
    };
  };

  it("optimal swap", async () => {
    // const before = await snapshot()
    let token_whale_signer = await impersonate(WHALE);
    await testUniswapOptimal.connect(token_whale_signer).zap(fromToken.address, toToken.address, AMOUNT, {
      from: WHALE
    });
    const after = await snapshot();

    console.log("lp", after.lp.toString());
    console.log("from", after.fromToken.toString());
    console.log("to", after.toToken.toString());
    /*
    lp 6725697573704786632
    from 0
    to 0
    */
  });

  it("sub-optimal swap", async () => {
    // const before = await snapshot()
    let token_whale_signer = await impersonate(WHALE);
    await testUniswapOptimal.connect(token_whale_signer).subOptimalZap(fromToken.address, toToken.address, AMOUNT, {
      from: WHALE
    });
    const after = await snapshot();
    console.log("lp", after.lp.toString());
    console.log("from", after.fromToken.toString());
    console.log("to", after.toToken.toString());
    /*
    lp 6715795000682778028
    from 1472389552327584966
    to 0
    */
  });
});