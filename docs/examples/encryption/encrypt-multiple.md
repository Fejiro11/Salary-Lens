# EncryptMultipleValues

**Author:** Zama Bounty Program - Season 11

> Demonstrates encrypting multiple values in a single transaction

**Chapter:** encryption  
**Category:** Multiple Values  
**Difficulty:** Intermediate  

## Overview

Shows how to batch multiple encrypted inputs efficiently

## Functions

### `storeMultipleValues()`

Demonstrates encrypting multiple values in a single transaction

Shows how to batch multiple encrypted inputs efficiently

Client-side, batch multiple values:

### `computeSum()`

Compute sum of all three values

**Returns:** handle Handle to encrypted sum for decryption

## Source Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptMultipleValues
 * @author Zama Bounty Program - Season 11
 * @notice Demonstrates encrypting multiple values in a single transaction
 * @dev Shows how to batch multiple encrypted inputs efficiently
 * 
 * @custom:chapter encryption
 * @custom:category Multiple Values
 * @custom:difficulty Intermediate
 */
contract EncryptMultipleValues is ZamaEthereumConfig {
    struct UserData {
        euint32 value1;
        euint32 value2;
        euint32 value3;
        bool isSet;
    }

    mapping(address => UserData) private userData;

    event MultipleValuesStored(address indexed user);

    constructor() ZamaEthereumConfig() {}

    /**
     * @notice Store three encrypted values at once
     * @dev Client-side, batch multiple values:
     * ```typescript
     * const input = fhevm.createEncryptedInput(contractAddress, userAddress);
     * input.add32(value1);
     * input.add32(value2);
     * input.add32(value3);
     * const { handles, inputProof } = await input.encrypt();
     * // handles[0], handles[1], handles[2] contain the three encrypted values
     * // inputProof is shared for all values in the batch
     * ```
     */
    function storeMultipleValues(
        externalEuint32 encValue1,
        externalEuint32 encValue2,
        externalEuint32 encValue3,
        bytes calldata inputProof
    ) external {
        // Convert all encrypted inputs
        euint32 v1 = FHE.fromExternal(encValue1, inputProof);
        euint32 v2 = FHE.fromExternal(encValue2, inputProof);
        euint32 v3 = FHE.fromExternal(encValue3, inputProof);

        // Store in struct
        userData[msg.sender] = UserData({
            value1: v1,
            value2: v2,
            value3: v3,
            isSet: true
        });

        // Grant permissions for all values
        FHE.allowThis(v1);
        FHE.allowThis(v2);
        FHE.allowThis(v3);
        FHE.allow(v1, msg.sender);
        FHE.allow(v2, msg.sender);
        FHE.allow(v3, msg.sender);

        emit MultipleValuesStored(msg.sender);
    }

    /**
     * @notice Compute sum of all three values
     * @return handle Handle to encrypted sum for decryption
     */
    function computeSum() external returns (bytes32 handle) {
        require(userData[msg.sender].isSet, "No data stored");

        UserData storage data = userData[msg.sender];
        
        // Add all three encrypted values
        euint32 sum = FHE.add(data.value1, data.value2);
        sum = FHE.add(sum, data.value3);

        FHE.allowThis(sum);
        FHE.allow(sum, msg.sender);
        FHE.makePubliclyDecryptable(sum);

        return euint32.unwrap(sum);
    }
}

```
