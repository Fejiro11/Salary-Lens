# FHEComparison

**Author:** Zama Bounty Program - Season 11

> Demonstrates FHE comparison operations (eq, ne, lt, le, gt, ge)

**Chapter:** basic  
**Category:** Comparison  
**Difficulty:** Beginner  

## Overview

Comparisons return encrypted booleans (ebool)

## Functions

### `isEqual()`

Demonstrates FHE comparison operations (eq, ne, lt, le, gt, ge)

Comparisons return encrypted booleans (ebool)

Returns encrypted boolean

### `isNotEqual()`

Check inequality: a != b

### `isLessThan()`

Check less than: a < b

### `isGreaterThan()`

Check greater than: a > b

### `requestDecryption()`

Request decryption of comparison result

## Source Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHEComparison
 * @author Zama Bounty Program - Season 11
 * @notice Demonstrates FHE comparison operations (eq, ne, lt, le, gt, ge)
 * @dev Comparisons return encrypted booleans (ebool)
 * 
 * @custom:chapter basic
 * @custom:category Comparison
 * @custom:difficulty Beginner
 */
contract FHEComparison is ZamaEthereumConfig {
    /// @notice Stored encrypted boolean result
    ebool private comparisonResult;

    event ComparisonCompleted(string operation, address indexed by);

    constructor() ZamaEthereumConfig() {}

    /**
     * @notice Check equality: a == b
     * @dev Returns encrypted boolean
     */
    function isEqual(
        externalEuint32 a,
        bytes calldata proofA,
        externalEuint32 b,
        bytes calldata proofB
    ) external {
        euint32 encA = FHE.fromExternal(a, proofA);
        euint32 encB = FHE.fromExternal(b, proofB);
        
        comparisonResult = FHE.eq(encA, encB);
        
        FHE.allowThis(comparisonResult);
        FHE.allow(comparisonResult, msg.sender);
        
        emit ComparisonCompleted("eq", msg.sender);
    }

    /**
     * @notice Check inequality: a != b
     */
    function isNotEqual(
        externalEuint32 a,
        bytes calldata proofA,
        externalEuint32 b,
        bytes calldata proofB
    ) external {
        euint32 encA = FHE.fromExternal(a, proofA);
        euint32 encB = FHE.fromExternal(b, proofB);
        
        comparisonResult = FHE.ne(encA, encB);
        
        FHE.allowThis(comparisonResult);
        FHE.allow(comparisonResult, msg.sender);
        
        emit ComparisonCompleted("ne", msg.sender);
    }

    /**
     * @notice Check less than: a < b
     */
    function isLessThan(
        externalEuint32 a,
        bytes calldata proofA,
        externalEuint32 b,
        bytes calldata proofB
    ) external {
        euint32 encA = FHE.fromExternal(a, proofA);
        euint32 encB = FHE.fromExternal(b, proofB);
        
        comparisonResult = FHE.lt(encA, encB);
        
        FHE.allowThis(comparisonResult);
        FHE.allow(comparisonResult, msg.sender);
        
        emit ComparisonCompleted("lt", msg.sender);
    }

    /**
     * @notice Check greater than: a > b
     */
    function isGreaterThan(
        externalEuint32 a,
        bytes calldata proofA,
        externalEuint32 b,
        bytes calldata proofB
    ) external {
        euint32 encA = FHE.fromExternal(a, proofA);
        euint32 encB = FHE.fromExternal(b, proofB);
        
        comparisonResult = FHE.gt(encA, encB);
        
        FHE.allowThis(comparisonResult);
        FHE.allow(comparisonResult, msg.sender);
        
        emit ComparisonCompleted("gt", msg.sender);
    }

    /**
     * @notice Request decryption of comparison result
     */
    function requestDecryption() external returns (bytes32 handle) {
        FHE.allowThis(comparisonResult);
        FHE.allow(comparisonResult, msg.sender);
        FHE.makePubliclyDecryptable(comparisonResult);
        
        return ebool.unwrap(comparisonResult);
    }
}

```
