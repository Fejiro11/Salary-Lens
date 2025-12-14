# FHEArithmetic

**Author:** Zama Bounty Program - Season 11

> Demonstrates FHE arithmetic operations (add, sub, mul, div)

**Chapter:** basic  
**Category:** Arithmetic  
**Difficulty:** Beginner  

## Overview

This example shows all basic arithmetic operations on encrypted values

## Functions

### `add()`

Demonstrates FHE arithmetic operations (add, sub, mul, div)

This example shows all basic arithmetic operations on encrypted values

FHE.add preserves encryption while computing sum

### `subtract()`

Subtract: a - b

FHE.sub computes encrypted difference

### `multiply()`

Multiply: a * b

FHE.mul computes encrypted product

### `divideByPlaintext()`

Divide encrypted by plaintext: encrypted / plaintext

FHE.div only supports encrypted / plaintext division

### `requestDecryption()`

Request decryption of the result

## Source Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHEArithmetic
 * @author Zama Bounty Program - Season 11
 * @notice Demonstrates FHE arithmetic operations (add, sub, mul, div)
 * @dev This example shows all basic arithmetic operations on encrypted values
 * 
 * @custom:chapter basic
 * @custom:category Arithmetic
 * @custom:difficulty Beginner
 */
contract FHEArithmetic is ZamaEthereumConfig {
    /// @notice Stored encrypted result
    euint32 private result;

    /// @notice Emitted after any operation
    event OperationCompleted(string operation, address indexed by);

    constructor() ZamaEthereumConfig() {
        result = FHE.asEuint32(0);
        FHE.allowThis(result);
    }

    /**
     * @notice Add two encrypted values: a + b
     * @dev FHE.add preserves encryption while computing sum
     */
    function add(
        externalEuint32 a,
        bytes calldata proofA,
        externalEuint32 b,
        bytes calldata proofB
    ) external {
        euint32 encA = FHE.fromExternal(a, proofA);
        euint32 encB = FHE.fromExternal(b, proofB);
        
        result = FHE.add(encA, encB);
        
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        
        emit OperationCompleted("add", msg.sender);
    }

    /**
     * @notice Subtract: a - b
     * @dev FHE.sub computes encrypted difference
     */
    function subtract(
        externalEuint32 a,
        bytes calldata proofA,
        externalEuint32 b,
        bytes calldata proofB
    ) external {
        euint32 encA = FHE.fromExternal(a, proofA);
        euint32 encB = FHE.fromExternal(b, proofB);
        
        result = FHE.sub(encA, encB);
        
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        
        emit OperationCompleted("sub", msg.sender);
    }

    /**
     * @notice Multiply: a * b
     * @dev FHE.mul computes encrypted product
     */
    function multiply(
        externalEuint32 a,
        bytes calldata proofA,
        externalEuint32 b,
        bytes calldata proofB
    ) external {
        euint32 encA = FHE.fromExternal(a, proofA);
        euint32 encB = FHE.fromExternal(b, proofB);
        
        result = FHE.mul(encA, encB);
        
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        
        emit OperationCompleted("mul", msg.sender);
    }

    /**
     * @notice Divide encrypted by plaintext: encrypted / plaintext
     * @dev FHE.div only supports encrypted / plaintext division
     */
    function divideByPlaintext(
        externalEuint32 a,
        bytes calldata proofA,
        uint32 divisor
    ) external {
        require(divisor > 0, "Division by zero");
        
        euint32 encA = FHE.fromExternal(a, proofA);
        
        result = FHE.div(encA, divisor);
        
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        
        emit OperationCompleted("div", msg.sender);
    }

    /**
     * @notice Request decryption of the result
     */
    function requestDecryption() external returns (bytes32 handle) {
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        FHE.makePubliclyDecryptable(result);
        
        return euint32.unwrap(result);
    }
}

```
