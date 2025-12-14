// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title AntiPatterns
 * @author Zama Bounty Program - Season 11
 * @notice Demonstrates common FHE mistakes and how to avoid them
 * @dev This contract shows what NOT to do, with correct alternatives
 * 
 * ## Common Mistakes:
 * 1. ❌ View functions returning encrypted values
 * 2. ❌ Forgetting FHE.allowThis() after state changes
 * 3. ❌ Mismatched encryption signer
 * 4. ❌ Returning encrypted values directly
 * 
 * @custom:chapter anti-patterns
 * @custom:category Common Mistakes
 * @custom:difficulty Beginner
 */
contract AntiPatterns is ZamaEthereumConfig {
    euint32 private secretValue;

    constructor() ZamaEthereumConfig() {
        secretValue = FHE.asEuint32(100);
        FHE.allowThis(secretValue);
    }

    // ============================================================
    // ❌ ANTI-PATTERN 1: View function returning encrypted value
    // ============================================================
    
    /**
     * @notice ❌ WRONG: Don't do this!
     * @dev View functions cannot return encrypted values because:
     *      - Encrypted values are handles, not actual data
     *      - The caller cannot use the handle without permissions
     *      - This exposes implementation details
     * 
     * This function is commented out because it's an anti-pattern:
     * ```solidity
     * function getSecretValue() external view returns (euint32) {
     *     return secretValue; // ❌ WRONG - exposes encrypted handle
     * }
     * ```
     */

    /**
     * @notice ✅ CORRECT: Request decryption instead
     * @dev Use the public decryption pattern to reveal values
     */
    function requestSecretDecryption() external returns (bytes32) {
        FHE.allowThis(secretValue);
        FHE.allow(secretValue, msg.sender);
        FHE.makePubliclyDecryptable(secretValue);
        return euint32.unwrap(secretValue);
    }

    // ============================================================
    // ❌ ANTI-PATTERN 2: Forgetting FHE.allowThis()
    // ============================================================

    /**
     * @notice ❌ WRONG: Missing FHE.allowThis()
     * @dev Without allowThis, the contract loses access to the value
     * 
     * This is wrong:
     * ```solidity
     * function setValueWrong(externalEuint32 val, bytes calldata proof) external {
     *     secretValue = FHE.fromExternal(val, proof);
     *     FHE.allow(secretValue, msg.sender); // ❌ Missing allowThis!
     * }
     * ```
     */

    /**
     * @notice ✅ CORRECT: Always call both permission functions
     */
    function setValueCorrect(
        externalEuint32 val,
        bytes calldata proof
    ) external {
        secretValue = FHE.fromExternal(val, proof);
        
        // ✅ Both permissions required
        FHE.allowThis(secretValue);           // Contract permission
        FHE.allow(secretValue, msg.sender);   // User permission
    }

    // ============================================================
    // ❌ ANTI-PATTERN 3: Comparing encrypted values in require
    // ============================================================

    /**
     * @notice ❌ WRONG: Cannot use encrypted values in require
     * @dev Encrypted comparisons return ebool, not bool
     * 
     * This won't compile:
     * ```solidity
     * function checkValueWrong(externalEuint32 val, bytes calldata proof) external {
     *     euint32 v = FHE.fromExternal(val, proof);
     *     require(FHE.gt(v, secretValue), "Too small"); // ❌ ebool != bool
     * }
     * ```
     */

    /**
     * @notice ✅ CORRECT: Use encrypted conditionals
     * @dev Use FHE.select() for conditional logic on encrypted values
     */
    function selectMaxValue(
        externalEuint32 val,
        bytes calldata proof
    ) external returns (bytes32) {
        euint32 v = FHE.fromExternal(val, proof);
        
        // Encrypted comparison
        ebool isGreater = FHE.gt(v, secretValue);
        
        // Encrypted conditional selection
        euint32 maxVal = FHE.select(isGreater, v, secretValue);
        
        FHE.allowThis(maxVal);
        FHE.allow(maxVal, msg.sender);
        FHE.makePubliclyDecryptable(maxVal);
        
        return euint32.unwrap(maxVal);
    }
}
