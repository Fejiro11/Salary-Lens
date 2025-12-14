import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get contract factory - replace with your contract name
  const ContractFactory = await ethers.getContractFactory("FHECounter");
  
  // Deploy
  const contract = await ContractFactory.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("✅ Contract deployed to:", address);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("\n📋 Deployment Summary:");
  console.log("   Network:", network.name);
  console.log("   Chain ID:", network.chainId.toString());
  console.log("   Contract:", address);
  
  console.log("\n🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
