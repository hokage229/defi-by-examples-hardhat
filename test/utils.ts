import { ethers, network } from "hardhat";

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


export {
  impersonate, reset
};