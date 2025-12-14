import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * @fileoverview Tests for AccessControlExample
 * @description Tests FHE permission management
 * 
 * @custom:example access-control
 * @custom:chapter access-control
 */
describe("AccessControlExample", function () {
  it("Should deploy successfully", async function () {
    const Factory = await ethers.getContractFactory("AccessControlExample");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    
    expect(await contract.getAddress()).to.be.properAddress;
  });

  it("Should have setBalance function", async function () {
    const Factory = await ethers.getContractFactory("AccessControlExample");
    const contract = await Factory.deploy();
    
    expect(contract.setBalance).to.be.a("function");
  });

  it("Should have grantViewAccess function", async function () {
    const Factory = await ethers.getContractFactory("AccessControlExample");
    const contract = await Factory.deploy();
    
    expect(contract.grantViewAccess).to.be.a("function");
  });

  it("Should track view access correctly", async function () {
    const Factory = await ethers.getContractFactory("AccessControlExample");
    const contract = await Factory.deploy();
    const [owner, viewer] = await ethers.getSigners();
    
    // Initially no access
    expect(await contract.hasViewAccess(owner.address, viewer.address)).to.be.false;
  });
});
