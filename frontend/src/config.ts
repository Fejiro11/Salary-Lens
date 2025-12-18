/**
 * @fileoverview Configuration for the Salary Lens frontend
 * @description Contains contract addresses, network settings, and ABI
 */

export const CONFIG = {
  // Sepolia Testnet configuration (FHEVM enabled)
  NETWORK: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io',
  },

  // Contract address - Deployed on Sepolia (V2 with @fhevm/solidity 0.9.x + ACL fix + isInitialized checks)
  CONTRACT_ADDRESS: '0xB097286D209e9Cce3120aFfBEE3E9Ad936D73AF7',

  // Zama Relayer URL for FHE operations on Sepolia
  RELAYER_URL: 'https://relayer.testnet.zama.org',
};

// Contract ABI (V2 - matches @fhevm/solidity 0.9.x contract)
export const SALARY_LENS_ABI = [
  {
    inputs: [
      { internalType: 'externalEuint32', name: 'encryptedSalary', type: 'bytes32' },
      { internalType: 'bytes', name: 'inputProof', type: 'bytes' },
    ],
    name: 'addSalary',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'requestAverageDecryption',
    outputs: [{ internalType: 'bytes32', name: 'handle', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes', name: 'abiEncodedCleartexts', type: 'bytes' },
      { internalType: 'bytes', name: 'decryptionProof', type: 'bytes' },
    ],
    name: 'verifyDecryption',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCount',
    outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'hasUserSubmitted',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getLastAverage',
    outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getPendingHandle',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'submitter', type: 'address' },
      { indexed: false, internalType: 'uint32', name: 'newCount', type: 'uint32' },
    ],
    name: 'SalarySubmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'requester', type: 'address' },
      { indexed: false, internalType: 'bytes32', name: 'handle', type: 'bytes32' },
    ],
    name: 'AverageRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'requester', type: 'address' },
      { indexed: false, internalType: 'uint32', name: 'average', type: 'uint32' },
    ],
    name: 'AverageDecrypted',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'handle', type: 'bytes32' },
      { internalType: 'address', name: 'user', type: 'address' },
    ],
    name: 'checkPermissions',
    outputs: [
      { internalType: 'bool', name: 'isPublic', type: 'bool' },
      { internalType: 'bool', name: 'isContractAllowed', type: 'bool' },
      { internalType: 'bool', name: 'isUserAllowed', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
