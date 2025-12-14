import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * @fileoverview Tests for FHECounter
 * @description Demonstrates testing patterns for basic FHE counter operations
 * 
 * @custom:example fhe-counter
 * @custom:chapter basic
 */
describe("FHECounter", function () {
  /**
   * ✅ Test: Contract deployment
   */
  it("Should deploy successfully", async function () {
    const Factory = await ethers.getContractFactory("FHECounter");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    
    expect(await contract.getAddress()).to.be.properAddress;
  });

  /**
   * ✅ Test: Increment function exists
   */
  it("Should have increment function", async function () {
    const Factory = await ethers.getContractFactory("FHECounter");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    
    expect(contract.increment).to.be.a("function");
  });

  /**
   * ✅ Test: Request decryption function exists
   */
  it("Should have requestDecryption function", async function () {
    const Factory = await ethers.getContractFactory("FHECounter");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    
    expect(contract.requestDecryption).to.be.a("function");
  });
});
