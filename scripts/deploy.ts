import { ethers } from "hardhat";

/**
 * @fileoverview Deployment script for the SalaryLens contract
 * @description Deploys the contract to the configured network (Zama Devnet or local)
 */

async function main() {
  console.log("🚀 Deploying SalaryLens contract...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy the contract
  const SalaryLens = await ethers.getContractFactory("SalaryLens");
  const salaryLens = await SalaryLens.deploy();

  await salaryLens.waitForDeployment();
  const contractAddress = await salaryLens.getAddress();

  console.log("✅ SalaryLens deployed to:", contractAddress);
  console.log("\n📋 Deployment Summary:");
  console.log("   Contract:", "SalaryLens");
  console.log("   Address:", contractAddress);
  console.log("   Deployer:", deployer.address);
  console.log("   Network:", (await ethers.provider.getNetwork()).name);
  console.log("   Chain ID:", (await ethers.provider.getNetwork()).chainId.toString());

  // Verify initial state
  const count = await salaryLens.getCount();
  console.log("\n🔍 Initial State:");
  console.log("   Count:", count.toString());

  console.log("\n🎉 Deployment complete!");
  console.log("\n💡 Next steps:");
  console.log("   1. Update frontend/src/config.ts with the contract address");
  console.log("   2. Run the frontend: cd frontend && npm run dev");

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
