import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * @fileoverview Tests for FHEArithmetic
 * @description Tests FHE arithmetic operations
 * 
 * @custom:example fhe-arithmetic
 * @custom:chapter basic
 */
describe("FHEArithmetic", function () {
  it("Should deploy successfully", async function () {
    const Factory = await ethers.getContractFactory("FHEArithmetic");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    
    expect(await contract.getAddress()).to.be.properAddress;
  });

  it("Should have add function", async function () {
    const Factory = await ethers.getContractFactory("FHEArithmetic");
    const contract = await Factory.deploy();
    
    expect(contract.add).to.be.a("function");
  });

  it("Should have subtract function", async function () {
    const Factory = await ethers.getContractFactory("FHEArithmetic");
    const contract = await Factory.deploy();
    
    expect(contract.subtract).to.be.a("function");
  });

  it("Should have multiply function", async function () {
    const Factory = await ethers.getContractFactory("FHEArithmetic");
    const contract = await Factory.deploy();
    
    expect(contract.multiply).to.be.a("function");
  });

  it("Should have divideByPlaintext function", async function () {
    const Factory = await ethers.getContractFactory("FHEArithmetic");
    const contract = await Factory.deploy();
    
    expect(contract.divideByPlaintext).to.be.a("function");
  });
});
