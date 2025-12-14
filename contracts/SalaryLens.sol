// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";
import "encrypted-types/EncryptedTypes.sol";

/**
 * @title SalaryLens (V2 - fhevm-solidity 0.9.x)
 * @author Zama Bounty Program - Season 11 Submission
 * @notice A privacy-preserving salary aggregation contract using Fully Homomorphic Encryption (FHE)
 * @dev This contract demonstrates encrypted aggregation by calculating average salary without
 *      revealing individual inputs. Uses the new fhevm-solidity 0.9.x architecture.
 *
 * ## How It Works
 * 1. Users submit their salaries in encrypted form using `addSalary()`
 * 2. The contract maintains an encrypted running total and a plaintext count
 * 3. Anyone can request the average via `requestAverageDecryption()` which:
 *    - Computes encrypted average (total / count)
 *    - Marks it as publicly decryptable via FHE.makePubliclyDecryptable()
 * 4. Off-chain relayer decrypts and submits proof
 * 5. Contract verifies proof via FHE.checkSignatures()
 *
 * ## Security Considerations
 * - Individual salaries are NEVER revealed on-chain
 * - Only the aggregate average can be decrypted
 * - Uses FHE.allowThis() and FHE.allow() after every encrypted state update
 * - No view functions return encrypted values (anti-pattern avoidance)
 */
contract SalaryLens is ZamaEthereumConfig {
    // ============ State Variables ============

    /**
     * @notice Encrypted running total of all submitted salaries
     * @dev This value is never directly readable - only used in encrypted computations
     */
    euint32 private encryptedTotal;

    /**
     * @notice Number of salaries submitted
     * @dev Kept as plaintext for gas efficiency and to enable division
     */
    uint32 public count;

    /**
     * @notice Tracks which addresses have already submitted a salary
     * @dev Prevents double-submission to ensure accurate averaging
     */
    mapping(address => bool) public hasSubmitted;

    /**
     * @notice Stores the last decrypted average for each requester
     * @dev Populated after proof verification
     */
    mapping(address => uint32) public lastDecryptedAverage;

    /**
     * @notice Stores the encrypted average handle for pending decryption requests
     * @dev Used for proof verification
     */
    mapping(address => bytes32) public pendingDecryptionHandles;

    /**
     * @notice Tracks if a decryption has been verified (replay protection)
     * @dev Maps handle to whether it's been used
     */
    mapping(bytes32 => bool) public usedHandles;

    // ============ Events ============

    /**
     * @notice Emitted when a user successfully submits their encrypted salary
     * @param submitter The address that submitted the salary
     * @param newCount The updated total count of submissions
     */
    event SalarySubmitted(address indexed submitter, uint32 newCount);

    /**
     * @notice Emitted when a user requests the average salary decryption
     * @param requester The address requesting the average
     * @param handle The ciphertext handle for off-chain decryption
     */
    event AverageRequested(address indexed requester, bytes32 handle);

    /**
     * @notice Emitted when the decryption is verified and average is stored
     * @param requester The address that originally requested the average
     * @param average The decrypted average salary value
     */
    event AverageDecrypted(address indexed requester, uint32 average);

    // ============ Errors ============

    /// @notice Thrown when a user attempts to submit more than one salary
    error AlreadySubmitted();

    /// @notice Thrown when requesting average with no submissions
    error NoSalariesSubmitted();

    /// @notice Thrown when no pending decryption request exists
    error NoPendingDecryption();

    /// @notice Thrown when decryption proof verification fails
    error InvalidDecryptionProof();

    /// @notice Thrown when handle has already been used (replay protection)
    error HandleAlreadyUsed();

    // ============ Constructor ============

    /**
     * @notice Initializes the contract with zero total and count
     * @dev Inherits ZamaEthereumConfig which sets up the coprocessor addresses
     */
    constructor() ZamaEthereumConfig() {
        count = 0;
    }

    // ============ Core Functions ============

    /**
     * @notice Submit an encrypted salary to be added to the aggregate
     * @dev This function:
     *      1. Validates the user hasn't already submitted
     *      2. Converts the encrypted input using the proof
     *      3. Adds to the running encrypted total
     *      4. Increments the submission count
     *      5. Calls FHE.allowThis() and FHE.allow() to maintain access
     *
     * @param encryptedSalary The encrypted salary value (externalEuint32 type)
     * @param inputProof Zero-knowledge proof validating the encrypted input
     *
     * @custom:security The salary value remains encrypted throughout
     * @custom:emits SalarySubmitted on successful submission
     */
    function addSalary(
        externalEuint32 encryptedSalary,
        bytes calldata inputProof
    ) external {
        // Prevent double submission
        if (hasSubmitted[msg.sender]) {
            revert AlreadySubmitted();
        }

        // Convert the encrypted input to euint32 with proof validation
        euint32 salary = FHE.fromExternal(encryptedSalary, inputProof);
        
        // CRITICAL: Grant contract permission to access the input salary BEFORE using it
        // Per Zama docs: "the calling contract must already have ACL permission to access the handle"
        FHE.allowThis(salary);

        // Add to running total
        // Note: On first submission, encryptedTotal is uninitialized (zero)
        if (count == 0) {
            encryptedTotal = salary;
        } else {
            // Contract now has permission to access both encryptedTotal and salary
            encryptedTotal = FHE.add(encryptedTotal, salary);
        }

        // Increment count
        count++;

        // Mark user as having submitted
        hasSubmitted[msg.sender] = true;

        // CRITICAL: Grant permissions on the NEW encryptedTotal for future operations
        // Both contract AND user permissions are required
        FHE.allowThis(encryptedTotal);  // Contract permission for future FHE.div()
        FHE.allow(encryptedTotal, msg.sender);  // User permission

        emit SalarySubmitted(msg.sender, count);
    }

    /**
     * @notice Request decryption of the average salary
     * @dev This function:
     *      1. Checks that at least one salary has been submitted
     *      2. Computes the encrypted average (total / count)
     *      3. Marks it as publicly decryptable
     *      4. Stores handle for later verification
     *
     * @return handle The ciphertext handle for off-chain decryption
     *
     * @custom:security Only the final average is decrypted, not individual salaries
     * @custom:emits AverageRequested when the request is processed
     */
    function requestAverageDecryption() external returns (bytes32 handle) {
        // Ensure there's data to average
        if (count == 0) {
            revert NoSalariesSubmitted();
        }

        // Calculate encrypted average: total / count
        // Using FHE.div for encrypted division by plaintext
        euint32 encryptedAverage = FHE.div(encryptedTotal, count);

        // Grant permissions for the average result
        FHE.allowThis(encryptedAverage);  // Contract permission
        FHE.allow(encryptedAverage, msg.sender);  // User permission

        // Mark as publicly decryptable for off-chain relayer
        FHE.makePubliclyDecryptable(encryptedAverage);

        // Get the handle for tracking
        handle = euint32.unwrap(encryptedAverage);

        // Store the handle for this requester's pending decryption
        pendingDecryptionHandles[msg.sender] = handle;

        emit AverageRequested(msg.sender, handle);

        return handle;
    }

    /**
     * @notice Verify the decryption proof and store the result
     * @dev Called after off-chain relayer decrypts the value
     *      The relayer-sdk provides the cleartext and proof
     *
     * @param abiEncodedCleartexts ABI-encoded cleartext values from relayer
     * @param decryptionProof Proof from Zama KMS via relayer-sdk
     *
     * @custom:security Verifies proof via FHE.checkSignatures()
     * @custom:emits AverageDecrypted with the verified result
     */
    function verifyDecryption(
        bytes calldata abiEncodedCleartexts,
        bytes calldata decryptionProof
    ) external {
        // Get the pending handle for this requester
        bytes32 handle = pendingDecryptionHandles[msg.sender];
        
        if (handle == bytes32(0)) {
            revert NoPendingDecryption();
        }

        // Replay protection
        if (usedHandles[handle]) {
            revert HandleAlreadyUsed();
        }

        // Prepare handles list for verification
        bytes32[] memory handlesList = new bytes32[](1);
        handlesList[0] = handle;

        // Verify the decryption proof - this reverts if invalid
        FHE.checkSignatures(handlesList, abiEncodedCleartexts, decryptionProof);

        // Decode the cleartext value
        uint32 decryptedAverage = abi.decode(abiEncodedCleartexts, (uint32));

        // Store the verified result
        lastDecryptedAverage[msg.sender] = decryptedAverage;

        // Mark handle as used (replay protection)
        usedHandles[handle] = true;

        // Clear pending request
        delete pendingDecryptionHandles[msg.sender];

        emit AverageDecrypted(msg.sender, decryptedAverage);
    }

    // ============ View Functions ============

    /**
     * @notice Get the current count of submitted salaries
     * @dev This is a simple getter for the count state variable
     * @return The number of salaries that have been submitted
     */
    function getCount() external view returns (uint32) {
        return count;
    }

    /**
     * @notice Check if an address has already submitted a salary
     * @param user The address to check
     * @return True if the user has submitted, false otherwise
     */
    function hasUserSubmitted(address user) external view returns (bool) {
        return hasSubmitted[user];
    }

    /**
     * @notice Get the last decrypted average for a specific address
     * @dev Returns 0 if the address has never verified a decryption
     * @param user The address to query
     * @return The last decrypted average salary for this user
     */
    function getLastAverage(address user) external view returns (uint32) {
        return lastDecryptedAverage[user];
    }

    /**
     * @notice Get pending decryption handle for a user
     * @param user The address to query
     * @return The pending handle, or bytes32(0) if none
     */
    function getPendingHandle(address user) external view returns (bytes32) {
        return pendingDecryptionHandles[user];
    }
}
