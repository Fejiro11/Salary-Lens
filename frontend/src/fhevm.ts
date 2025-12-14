/**
 * @fileoverview FHE (Fully Homomorphic Encryption) helper for the frontend
 * @description Uses Zama relayer-sdk from CDN (v0.2.0) for real FHE encryption on Sepolia
 * Based on working pattern from: https://github.com/dordunu1/Ratings
 */

import { BrowserProvider } from 'ethers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fhevmInstance: any = null;

/**
 * Initialize the FHEVM instance using CDN-loaded SDK
 * @param provider - The ethers BrowserProvider connected to the user's wallet
 * @returns The initialized FhevmInstance
 */
export async function initializeFhevm(provider: BrowserProvider): Promise<any> {
  if (fhevmInstance) {
    return fhevmInstance;
  }

  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Ethereum provider not found. Please install MetaMask or connect a wallet.');
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  
  console.log('Initializing FHEVM for address:', address);
  
  // Use npm package /bundle import (CDN UMD loaded for WASM support)
  // Per docs: https://docs.zama.org/protocol/relayer-sdk-guides/development-guide/webapp
  const { initSDK, createInstance, SepoliaConfig } = await import('@zama-fhe/relayer-sdk/bundle');

  console.log('SDK loaded, initializing...');
  await initSDK(); // Initializes the SDK with CDN-loaded WASM
  
  // Explicit Sepolia config from docs:
  // https://docs.zama.org/protocol/solidity-guides/smart-contract/configure/contract_addresses
  const sepoliaConfig = {
    aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
    kmsContractAddress: '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
    inputVerifierContractAddress: '0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0',
    verifyingContractAddressDecryption: '0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478',
    verifyingContractAddressInputVerification: '0x483b9dE06E4E4C7D35CCf5837A1668487406D955',
    chainId: 11155111, // Sepolia
    gatewayChainId: 10901,
    relayerUrl: 'https://relayer.testnet.zama.org',
    network: (window as any).ethereum,
  };
  
  console.log('Using explicit Sepolia config:', sepoliaConfig);
  console.log('SDK SepoliaConfig for comparison:', SepoliaConfig);
  
  console.log('Creating FHEVM instance...');
  fhevmInstance = await createInstance(sepoliaConfig);
  
  console.log('FHEVM initialized successfully!');
  return fhevmInstance;
}

/**
 * Encrypt a salary value for submission to the contract
 * @param salary - The plaintext salary value
 * @param contractAddress - The address of the SalaryLens contract
 * @param userAddress - The address of the user submitting
 * @returns Object containing the encrypted input handle and proof
 */
export async function encryptSalary(
  salary: number,
  contractAddress: string,
  userAddress: string
): Promise<{ encryptedSalary: string; inputProof: string }> {
  if (!fhevmInstance) {
    throw new Error('FHEVM not initialized. Call initializeFhevm first.');
  }

  // Create encrypted input bound to contract and user
  const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
  input.add32(salary);

  // Encrypt and get the proof
  const encrypted = await input.encrypt();

  // Convert Uint8Array to hex strings for contract interaction
  const handleHex = '0x' + Array.from(encrypted.handles[0] as Uint8Array)
    .map((b: number) => b.toString(16).padStart(2, '0')).join('');
  const proofHex = '0x' + Array.from(encrypted.inputProof as Uint8Array)
    .map((b: number) => b.toString(16).padStart(2, '0')).join('');

  return {
    encryptedSalary: handleHex,
    inputProof: proofHex,
  };
}

/**
 * Request public decryption of ciphertext handles
 * Per docs: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/public-decryption
 * 
 * @param handles - Array of ciphertext handles (hex strings) to decrypt
 * @returns PublicDecryptResults { clearValues, abiEncodedClearValues, decryptionProof }
 */
export async function publicDecrypt(handles: string[]): Promise<{
  clearValues: Record<string, bigint | boolean | string>;
  abiEncodedClearValues: string;
  decryptionProof: string;
}> {
  if (!fhevmInstance) {
    throw new Error('FHEVM not initialized. Call initializeFhevm first.');
  }

  // Validate handle format (should be 0x + 64 hex chars = 66 total)
  for (const handle of handles) {
    console.log('[publicDecrypt] Handle:', handle, 'Length:', handle.length);
    if (!handle.startsWith('0x') || handle.length !== 66) {
      console.warn('[publicDecrypt] Handle may be malformed. Expected 0x + 64 hex chars');
    }
  }

  console.log('[publicDecrypt] Calling relayer with handles:', handles);
  
  // Use relayer-sdk to request public decryption
  const result = await fhevmInstance.publicDecrypt(handles);
  
  console.log('[publicDecrypt] Result:', result);
  
  return result;
}

/**
 * Get the current FHEVM instance
 * @returns The FhevmInstance or null if not initialized
 */
export function getFhevmInstance(): any {
  return fhevmInstance;
}

/**
 * Check if FHEVM is initialized
 * @returns True if initialized, false otherwise
 */
export function isFhevmInitialized(): boolean {
  return fhevmInstance !== null;
}

// ACL Contract ABI (minimal for isPubliclyDecryptable check)
const ACL_ABI = [
  'function isPubliclyDecryptable(bytes32 handle) external view returns (bool)',
  'function isAllowed(bytes32 handle, address account) external view returns (bool)',
];

// ACL Contract address on Sepolia
const ACL_CONTRACT_ADDRESS = '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D';

/**
 * Check if a ciphertext handle is publicly decryptable via ACL contract
 * @param handle - The ciphertext handle (hex string)
 * @param provider - ethers provider
 * @returns True if publicly decryptable, false otherwise
 */
export async function checkACLPermission(
  handle: string,
  provider: BrowserProvider
): Promise<{ isPubliclyDecryptable: boolean; isAllowedForContract: boolean; isAllowedForUser: boolean }> {
  const { Contract } = await import('ethers');
  const aclContract = new Contract(ACL_CONTRACT_ADDRESS, ACL_ABI, provider);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();
  
  try {
    const isPublic = await aclContract.isPubliclyDecryptable(handle);
    console.log('[ACL] isPubliclyDecryptable:', isPublic);
    
    // Check if the contract has permission
    const contractAddress = '0x2d9b508fc491eddc827b7d3683a66be8ae428279'; // SalaryLens
    const isAllowedContract = await aclContract.isAllowed(handle, contractAddress);
    console.log('[ACL] isAllowed for contract:', isAllowedContract);
    
    // Check if the user has permission (for user decryption)
    const isAllowedUser = await aclContract.isAllowed(handle, userAddress);
    console.log('[ACL] isAllowed for user:', isAllowedUser);
    
    return { isPubliclyDecryptable: isPublic, isAllowedForContract: isAllowedContract, isAllowedForUser: isAllowedUser };
  } catch (error) {
    console.error('[ACL] Error checking permissions:', error);
    return { isPubliclyDecryptable: false, isAllowedForContract: false, isAllowedForUser: false };
  }
}

/**
 * Perform user decryption (alternative to public decryption)
 * Per docs: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption
 * Requires FHE.allow(ciphertext, userAddress) in contract
 * 
 * @param handle - The ciphertext handle (hex string)
 * @param contractAddress - The contract address holding the ciphertext
 * @param signer - ethers Signer for signing EIP712
 * @returns The decrypted value
 */
export async function userDecrypt(
  handle: string,
  contractAddress: string,
  signer: any
): Promise<bigint | boolean | string> {
  if (!fhevmInstance) {
    throw new Error('FHEVM not initialized. Call initializeFhevm first.');
  }

  console.log('[userDecrypt] Starting user decryption for handle:', handle);
  
  // Generate keypair for user decryption
  const keypair = fhevmInstance.generateKeypair();
  console.log('[userDecrypt] Generated keypair');
  
  const handleContractPairs = [
    {
      handle: handle,
      contractAddress: contractAddress,
    },
  ];
  
  const startTimeStamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = '10';
  const contractAddresses = [contractAddress];
  
  // Create EIP712 signature request
  const eip712 = fhevmInstance.createEIP712(
    keypair.publicKey,
    contractAddresses,
    startTimeStamp,
    durationDays,
  );
  
  console.log('[userDecrypt] Created EIP712, requesting signature...');
  
  // Sign the EIP712 message
  const signature = await signer.signTypedData(
    eip712.domain,
    {
      UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
    },
    eip712.message,
  );
  
  console.log('[userDecrypt] Got signature, calling userDecrypt...');
  
  // Perform user decryption
  const result = await fhevmInstance.userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signature.replace('0x', ''),
    contractAddresses,
    await signer.getAddress(),
    startTimeStamp,
    durationDays,
  );
  
  console.log('[userDecrypt] Result:', result);
  
  return result[handle];
}
