// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptSingleValue
 * @author Zama Bounty Program - Season 11
 * @notice Demonstrates how to encrypt a single value from user input
 * @dev Shows the complete flow from plaintext -> encrypted -> stored
 * 
 * ## Input Proofs Explained
 * Input proofs are zero-knowledge proofs that attest:
 * 1. The encrypted value was created by the claimed user
 * 2. The encryption is bound to a specific contract address
 * 3. The ciphertext hasn't been tampered with
 * 
 * @custom:chapter encryption
 * @custom:category Single Value
 * @custom:difficulty Beginner
 */
contract EncryptSingleValue is ZamaEthereumConfig {
    /// @notice Mapping of user addresses to their encrypted values
    mapping(address => euint32) private userValues;

    /// @notice Tracks which users have stored a value
    mapping(address => bool) public hasStoredValue;

    event ValueStored(address indexed user);

    constructor() ZamaEthereumConfig() {}

    /**
     * @notice Store an encrypted value for the caller
     * @param encryptedValue The encrypted uint32 value
     * @param inputProof ZK proof validating the encryption
     * 
     * @dev The encryption flow:
     * 1. User encrypts value client-side using relayer-sdk
     * 2. User submits encrypted value + proof to this function
     * 3. Contract validates proof via FHE.fromExternal()
     * 4. Contract stores the encrypted value
     * 
     * Client-side encryption:
     * ```typescript
     * const input = fhevm.createEncryptedInput(contractAddress, userAddress);
     * input.add32(myValue);
     * const { handles, inputProof } = await input.encrypt();
     * await contract.storeValue(handles[0], inputProof);
     * ```
     */
    function storeValue(
        externalEuint32 encryptedValue,
        bytes calldata inputProof
    ) external {
        // Validate and convert the encrypted input
        // This verifies the ZK proof automatically
        euint32 value = FHE.fromExternal(encryptedValue, inputProof);

        // Store the encrypted value for this user
        userValues[msg.sender] = value;
        hasStoredValue[msg.sender] = true;

        // CRITICAL: Grant permissions
        // Without this, the contract cannot use the value later
        FHE.allowThis(value);
        FHE.allow(value, msg.sender);

        emit ValueStored(msg.sender);
    }

    /**
     * @notice Request decryption of caller's stored value
     * @return handle The ciphertext handle for off-chain decryption
     */
    function requestDecryption() external returns (bytes32 handle) {
        require(hasStoredValue[msg.sender], "No value stored");

        euint32 value = userValues[msg.sender];
        
        FHE.allowThis(value);
        FHE.allow(value, msg.sender);
        FHE.makePubliclyDecryptable(value);

        return euint32.unwrap(value);
    }
}
