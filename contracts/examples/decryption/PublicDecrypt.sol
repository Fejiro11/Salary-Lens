// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PublicDecrypt
 * @author Zama Bounty Program - Season 11
 * @notice Demonstrates the public decryption pattern with proof verification
 * @dev Shows the complete 3-step decryption flow:
 *      1. On-chain: Mark value as publicly decryptable
 *      2. Off-chain: Request decryption from relayer
 *      3. On-chain: Verify decryption proof
 * 
 * @custom:chapter decryption
 * @custom:category Public Decryption
 * @custom:difficulty Intermediate
 */
contract PublicDecrypt is ZamaEthereumConfig {
    /// @notice The encrypted value to be decrypted
    euint32 private encryptedValue;

    /// @notice The decrypted result (after verification)
    uint32 public decryptedResult;

    /// @notice Handle for pending decryption
    bytes32 public pendingHandle;

    /// @notice Whether a decryption has been verified
    bool public isDecrypted;

    event ValueSet(bytes32 handle);
    event DecryptionRequested(bytes32 handle);
    event DecryptionVerified(uint32 result);

    constructor() ZamaEthereumConfig() {
        encryptedValue = FHE.asEuint32(42); // Default encrypted value
        FHE.allowThis(encryptedValue);
    }

    /**
     * @notice Set a new encrypted value
     */
    function setValue(
        externalEuint32 newValue,
        bytes calldata inputProof
    ) external {
        encryptedValue = FHE.fromExternal(newValue, inputProof);
        
        FHE.allowThis(encryptedValue);
        FHE.allow(encryptedValue, msg.sender);
        
        isDecrypted = false;
        pendingHandle = bytes32(0);
        
        emit ValueSet(euint32.unwrap(encryptedValue));
    }

    /**
     * @notice Step 1: Request public decryption
     * @dev Marks the encrypted value as publicly decryptable
     *      After calling this, use relayer-sdk off-chain:
     *      ```typescript
     *      const result = await fhevm.publicDecrypt([handle]);
     *      // result contains: clearValues, abiEncodedClearValues, decryptionProof
     *      ```
     */
    function requestDecryption() external returns (bytes32 handle) {
        FHE.allowThis(encryptedValue);
        FHE.allow(encryptedValue, msg.sender);
        
        // Mark as publicly decryptable - anyone can now request decryption
        FHE.makePubliclyDecryptable(encryptedValue);
        
        handle = euint32.unwrap(encryptedValue);
        pendingHandle = handle;
        
        emit DecryptionRequested(handle);
        return handle;
    }

    /**
     * @notice Step 3: Verify decryption proof and store result
     * @param abiEncodedCleartexts ABI-encoded decrypted value from relayer
     * @param decryptionProof KMS signatures proving correct decryption
     * 
     * @dev The relayer-sdk provides both parameters:
     *      ```typescript
     *      await contract.verifyDecryption(
     *        result.abiEncodedClearValues,
     *        result.decryptionProof
     *      );
     *      ```
     */
    function verifyDecryption(
        bytes calldata abiEncodedCleartexts,
        bytes calldata decryptionProof
    ) external {
        require(pendingHandle != bytes32(0), "No pending decryption");

        // Prepare handles list
        bytes32[] memory handlesList = new bytes32[](1);
        handlesList[0] = pendingHandle;

        // Verify the proof - reverts if invalid
        FHE.checkSignatures(handlesList, abiEncodedCleartexts, decryptionProof);

        // Decode and store the result
        decryptedResult = abi.decode(abiEncodedCleartexts, (uint32));
        isDecrypted = true;
        pendingHandle = bytes32(0);

        emit DecryptionVerified(decryptedResult);
    }
}
