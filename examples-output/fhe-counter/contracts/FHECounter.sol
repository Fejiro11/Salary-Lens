// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHECounter
 * @author Zama Bounty Program - Season 11
 * @notice A simple encrypted counter demonstrating basic FHE operations
 * @dev This example shows:
 *      - Encrypted state variables (euint32)
 *      - FHE arithmetic operations (FHE.add)
 *      - Permission management (FHE.allowThis, FHE.allow)
 *      - Public decryption pattern
 * 
 * @custom:chapter basic
 * @custom:category Counter
 * @custom:difficulty Beginner
 */
contract FHECounter is ZamaEthereumConfig {
    /// @notice The encrypted counter value
    euint32 private encryptedCounter;

    /// @notice Emitted when the counter is incremented
    event CounterIncremented(address indexed by);

    /// @notice Emitted when counter is made publicly decryptable
    event DecryptionRequested(bytes32 handle);

    /**
     * @notice Initialize the counter to encrypted zero
     */
    constructor() ZamaEthereumConfig() {
        encryptedCounter = FHE.asEuint32(0);
        FHE.allowThis(encryptedCounter);
    }

    /**
     * @notice Increment the counter by 1
     * @dev Demonstrates FHE.add operation with plaintext value
     * 
     * ✅ CRITICAL: Always call FHE.allowThis() after modifying encrypted state
     */
    function increment() external {
        // Add 1 to the encrypted counter
        encryptedCounter = FHE.add(encryptedCounter, 1);
        
        // CRITICAL: Grant permissions after state change
        FHE.allowThis(encryptedCounter);
        FHE.allow(encryptedCounter, msg.sender);
        
        emit CounterIncremented(msg.sender);
    }

    /**
     * @notice Add an encrypted value to the counter
     * @param encryptedValue The encrypted value to add
     * @param inputProof Zero-knowledge proof for the encrypted input
     * 
     * @dev Demonstrates FHE.add with two encrypted values
     */
    function addEncrypted(
        externalEuint32 encryptedValue,
        bytes calldata inputProof
    ) external {
        // Convert external input to euint32
        euint32 value = FHE.fromExternal(encryptedValue, inputProof);
        
        // Add encrypted values
        encryptedCounter = FHE.add(encryptedCounter, value);
        
        // Grant permissions
        FHE.allowThis(encryptedCounter);
        FHE.allow(encryptedCounter, msg.sender);
        
        emit CounterIncremented(msg.sender);
    }

    /**
     * @notice Request public decryption of the counter
     * @return handle The ciphertext handle for off-chain decryption
     * 
     * @dev After calling this, use relayer-sdk to decrypt off-chain
     */
    function requestDecryption() external returns (bytes32 handle) {
        // Grant permissions
        FHE.allowThis(encryptedCounter);
        FHE.allow(encryptedCounter, msg.sender);
        
        // Mark as publicly decryptable
        FHE.makePubliclyDecryptable(encryptedCounter);
        
        handle = euint32.unwrap(encryptedCounter);
        emit DecryptionRequested(handle);
        
        return handle;
    }
}
