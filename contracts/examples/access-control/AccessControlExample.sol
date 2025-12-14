// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title AccessControlExample
 * @author Zama Bounty Program - Season 11
 * @notice Demonstrates FHE permission management patterns
 * @dev Shows the difference between:
 *      - FHE.allowThis() - Contract can use the encrypted value
 *      - FHE.allow(value, address) - Specific address can use the value
 *      - FHE.allowTransient() - Temporary permission within transaction
 * 
 * ## Permission Model
 * FHE values are bound to [contract, user] pairs. Both the contract
 * AND the user need permission to operate on encrypted values.
 * 
 * @custom:chapter access-control
 * @custom:category Permissions
 * @custom:difficulty Intermediate
 */
contract AccessControlExample is ZamaEthereumConfig {
    /// @notice Encrypted balance per user
    mapping(address => euint32) private balances;

    /// @notice Addresses that have been granted access to view balances
    mapping(address => mapping(address => bool)) public hasViewAccess;

    event BalanceSet(address indexed user);
    event AccessGranted(address indexed owner, address indexed viewer);

    constructor() ZamaEthereumConfig() {}

    /**
     * @notice Set caller's encrypted balance
     * @dev Demonstrates basic permission setup after storing encrypted value
     * 
     * ✅ CORRECT: Grant both contract and user permissions
     */
    function setBalance(
        externalEuint32 encryptedBalance,
        bytes calldata inputProof
    ) external {
        euint32 balance = FHE.fromExternal(encryptedBalance, inputProof);
        balances[msg.sender] = balance;

        // ✅ CRITICAL: Both permissions required
        FHE.allowThis(balance);           // Contract can use it
        FHE.allow(balance, msg.sender);   // User can use it

        emit BalanceSet(msg.sender);
    }

    /**
     * @notice Grant another address permission to view your balance
     * @param viewer The address to grant view access
     * 
     * @dev This demonstrates sharing encrypted values between users
     */
    function grantViewAccess(address viewer) external {
        require(FHE.isInitialized(balances[msg.sender]), "No balance set");

        euint32 balance = balances[msg.sender];
        
        // Grant the viewer permission to use this encrypted value
        FHE.allow(balance, viewer);
        hasViewAccess[msg.sender][viewer] = true;

        emit AccessGranted(msg.sender, viewer);
    }

    /**
     * @notice Request decryption of your own balance
     */
    function requestOwnDecryption() external returns (bytes32) {
        require(FHE.isInitialized(balances[msg.sender]), "No balance");

        euint32 balance = balances[msg.sender];
        
        FHE.allowThis(balance);
        FHE.allow(balance, msg.sender);
        FHE.makePubliclyDecryptable(balance);

        return euint32.unwrap(balance);
    }

    /**
     * @notice Request decryption of another user's balance (if granted)
     * @param owner The address whose balance to decrypt
     */
    function requestViewerDecryption(address owner) external returns (bytes32) {
        require(hasViewAccess[owner][msg.sender], "No view access");
        require(FHE.isInitialized(balances[owner]), "No balance");

        euint32 balance = balances[owner];
        
        // The viewer already has permission (from grantViewAccess)
        FHE.makePubliclyDecryptable(balance);

        return euint32.unwrap(balance);
    }
}
