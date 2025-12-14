/**
 * @fileoverview Main application component for The Salary Lens
 * @description React frontend for privacy-preserving salary aggregation
 */

import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { CONFIG, SALARY_LENS_ABI } from './config';
import { initializeFhevm, encryptSalary, publicDecrypt, checkACLPermission, userDecrypt } from './fhevm';

// Extend window type for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

// Demo mode flag - set to false for real FHE on Sepolia
// Set to true for local testing without FHE infrastructure
// NOTE: Public decryption via Zama Relayer may return HTTP 500 if 
// the ciphertext isn't indexed yet. ACL permissions are checked first.
const DEMO_MODE = false;

// Demo data storage key for localStorage
const DEMO_STORAGE_KEY = 'salaryLens_demoData';

// Load demo data from localStorage or initialize empty
const loadDemoData = (): { salaries: number[]; submittedAddresses: string[] } => {
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load demo data from localStorage:', e);
  }
  return { salaries: [], submittedAddresses: [] };
};

// Save demo data to localStorage
const saveDemoData = (data: { salaries: number[]; submittedAddresses: string[] }) => {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save demo data to localStorage:', e);
  }
};

// Demo data storage (persisted to localStorage)
const demoData = {
  ...loadDemoData(),
  // Helper to check if address has submitted
  hasSubmitted(address: string): boolean {
    return this.submittedAddresses.includes(address);
  },
  // Add a salary and save
  addSalary(salary: number, address: string) {
    this.salaries.push(salary);
    if (!this.submittedAddresses.includes(address)) {
      this.submittedAddresses.push(address);
    }
    saveDemoData({ salaries: this.salaries, submittedAddresses: this.submittedAddresses });
  },
  // Get count
  getCount(): number {
    return this.salaries.length;
  },
  // Calculate average
  getAverage(): number {
    if (this.salaries.length === 0) return 0;
    return Math.round(this.salaries.reduce((a, b) => a + b, 0) / this.salaries.length);
  },
  // Clear all data (for testing)
  clear() {
    this.salaries = [];
    this.submittedAddresses = [];
    localStorage.removeItem(DEMO_STORAGE_KEY);
  }
};

/**
 * Application state interface
 */
interface AppState {
  isConnected: boolean;
  address: string | null;
  count: number;
  hasSubmitted: boolean;
  lastAverage: number | null;
  isLoading: boolean;
  error: string | null;
  txStatus: string | null;
  isDemoMode: boolean;
}

/**
 * Main App component
 */
function App() {
  const [state, setState] = useState<AppState>({
    isConnected: false,
    address: null,
    count: 0,
    hasSubmitted: false,
    lastAverage: null,
    isLoading: false,
    error: null,
    txStatus: null,
    isDemoMode: DEMO_MODE,
  });

  const [salary, setSalary] = useState<string>('');
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);

  /**
   * Connect to MetaMask wallet
   */
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setState((prev) => ({ ...prev, error: 'Please install MetaMask to use this app' }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Request account access
      console.log('Step 1: Requesting accounts...');
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      console.log('Accounts:', accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Step 2: Check and switch network
      console.log('Step 2: Checking network...');
      const chainId = (await window.ethereum.request({
        method: 'eth_chainId',
      })) as string;
      console.log('Current chainId:', chainId, 'Expected:', CONFIG.NETWORK.chainId);

      if (parseInt(chainId, 16) !== CONFIG.NETWORK.chainId) {
        console.log('Switching network...');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CONFIG.NETWORK.chainId.toString(16)}` }],
          });
        } catch (switchError: unknown) {
          const error = switchError as { code: number };
          console.log('Switch error code:', error.code);
          if (error.code === 4902) {
            // Network not added, add it
            console.log('Adding network...');
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${CONFIG.NETWORK.chainId.toString(16)}`,
                  chainName: CONFIG.NETWORK.name,
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://rpc.sepolia.org'],
                  blockExplorerUrls: [CONFIG.NETWORK.blockExplorer],
                },
              ],
            });
          } else if (error.code === 4001) {
            throw new Error('You rejected the network switch. Please switch to Sepolia manually.');
          } else {
            throw switchError;
          }
        }
      }

      // Step 3: Create provider and contract
      console.log('Step 3: Creating provider...');
      const browserProvider = new BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      const signer = await browserProvider.getSigner();
      const contractInstance = new Contract(
        CONFIG.CONTRACT_ADDRESS,
        SALARY_LENS_ABI,
        signer
      );
      setContract(contractInstance);

      // Step 4: Get initial state
      console.log('Step 4: Reading state...');
      let count = 0;
      let hasSubmitted = false;
      let lastAverage = 0;
      
      if (DEMO_MODE) {
        // Load from localStorage in demo mode
        count = demoData.getCount();
        hasSubmitted = demoData.hasSubmitted(accounts[0]);
        lastAverage = demoData.getAverage();
        console.log('Demo state loaded from localStorage:', { count, hasSubmitted, lastAverage });
      } else {
        // Production mode: Initialize FHEVM and read from contract
        try {
          console.log('Initializing FHEVM...');
          await initializeFhevm(browserProvider);
          console.log('FHEVM initialized successfully!');
          
          count = Number(await contractInstance.getCount());
          hasSubmitted = await contractInstance.hasUserSubmitted(accounts[0]);
          lastAverage = Number(await contractInstance.getLastAverage(accounts[0]));
          console.log('Contract state:', { count, hasSubmitted, lastAverage });
        } catch (contractErr) {
          console.warn('Could not initialize FHEVM or read contract state:', contractErr);
        }
      }

      setState((prev) => ({
        ...prev,
        isConnected: true,
        address: accounts[0],
        count: count,
        hasSubmitted: hasSubmitted,
        lastAverage: lastAverage > 0 ? lastAverage : null,
        isLoading: false,
      }));
      
      console.log('Connection successful!');
    } catch (err: unknown) {
      console.error('Connection error:', err);
      const error = err as { code?: number; message?: string };
      let errorMessage = 'Failed to connect wallet. ';
      
      if (error.code === 4001) {
        errorMessage = 'Connection rejected. Please approve the connection in MetaMask.';
      } else if (error.code === -32002) {
        errorMessage = 'Connection pending. Please check MetaMask for a pending request.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * Submit encrypted salary
   * In demo mode: simulates the FHE encryption flow
   * In production: would use fhevmjs for actual encryption
   */
  const handleSubmitSalary = async () => {
    if (!salary) return;
    if (!DEMO_MODE && (!contract || !provider)) return;

    const salaryValue = parseInt(salary, 10);
    if (isNaN(salaryValue) || salaryValue < 0) {
      setState((prev) => ({ ...prev, error: 'Please enter a valid salary' }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null, txStatus: '🔐 Encrypting salary with FHE...' }));

    try {
      if (DEMO_MODE) {
        // Demo mode: simulate the encryption and submission flow
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate encryption time
        
        setState((prev) => ({ ...prev, txStatus: '📤 Submitting encrypted salary to blockchain...' }));
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate tx submission
        
        setState((prev) => ({ ...prev, txStatus: '⏳ Waiting for confirmation...' }));
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate confirmation
        
        // Store in demo data (persisted to localStorage)
        demoData.addSalary(salaryValue, state.address || '');
        
        setState((prev) => ({
          ...prev,
          count: demoData.getCount(),
          hasSubmitted: true,
          isLoading: false,
          txStatus: null,
          error: null,
        }));
        
        setSalary('');
        console.log('Demo: Salary submitted (simulated)', { salary: salaryValue, totalCount: demoData.salaries.length });
      } else {
        // Production mode with real FHE on Sepolia
        console.log('Initializing FHEVM if needed...');
        
        // Ensure FHEVM is initialized before encrypting
        await initializeFhevm(provider!);
        
        console.log('Encrypting salary with real FHE...');
        const { encryptedSalary, inputProof } = await encryptSalary(
          salaryValue, 
          CONFIG.CONTRACT_ADDRESS,
          state.address!
        );
        
        setState((prev) => ({ ...prev, txStatus: '📤 Submitting encrypted salary to blockchain...' }));
        const tx = await contract!.addSalary(encryptedSalary, inputProof);
        
        setState((prev) => ({ ...prev, txStatus: '⏳ Waiting for confirmation...' }));
        await tx.wait();
        
        // Get updated count from contract
        const newCount = await contract!.getCount();
        
        setState((prev) => ({
          ...prev,
          count: Number(newCount),
          hasSubmitted: true,
          isLoading: false,
          txStatus: null,
          error: null,
        }));
        
        setSalary('');
        console.log('Real FHE: Salary submitted successfully!', { count: Number(newCount) });
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Submission error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        txStatus: null,
        error: `Failed to submit salary: ${error?.message || 'Unknown error'}`,
      }));
    }
  };

  /**
   * Request average decryption via Gateway
   * In demo mode: calculates and reveals simulated average
   * In production: would use Zama Gateway for decryption
   */
  const handleRequestAverage = async () => {
    if (!DEMO_MODE && !contract) return;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      txStatus: '🔓 Requesting decryption from Gateway...',
    }));

    try {
      if (DEMO_MODE) {
        // Demo mode: simulate Gateway decryption
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setState((prev) => ({ ...prev, txStatus: '🔑 Gateway processing encrypted data...' }));
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setState((prev) => ({ ...prev, txStatus: '📊 Decrypting average...' }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Calculate average from demo data (persisted in localStorage)
        const average = demoData.getAverage();
        
        setState((prev) => ({
          ...prev,
          lastAverage: average,
          isLoading: false,
          txStatus: null,
        }));
        
        console.log('Demo: Average decrypted (simulated)', { average, salaries: demoData.salaries });
        return;
      }

      // Production mode with real FHE decryption
      // First check if there are any salaries submitted
      const currentCount = await contract!.getCount();
      console.log('Current salary count:', Number(currentCount));
      
      if (Number(currentCount) === 0) {
        throw new Error('No salaries have been submitted yet. Submit a salary first.');
      }
      
      console.log('Requesting average decryption...');
      const tx = await contract!.requestAverageDecryption();
      setState((prev) => ({ ...prev, txStatus: '⏳ Waiting for transaction confirmation...' }));
      const receipt = await tx.wait();
      
      // Get the handle from the event
      let handle: string | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract!.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed?.name === 'AverageRequested') {
            handle = parsed.args[1]; // handle is second arg
            break;
          }
        } catch {
          // Not our event
        }
      }
      
      if (!handle) {
        throw new Error('Could not find AverageRequested event');
      }
      
      // Ensure handle is properly formatted as hex string
      const handleHex = typeof handle === 'string' ? handle : `0x${(handle as bigint).toString(16).padStart(64, '0')}`;
      console.log('Got handle:', handle);
      console.log('Handle as hex:', handleHex);
      console.log('Handle type:', typeof handle);
      console.log('Handle length:', handleHex.length);
      
      // Check ACL permissions before attempting decryption
      setState((prev) => ({ ...prev, txStatus: '🔍 Checking ACL permissions...' }));
      const aclStatus = await checkACLPermission(handleHex, provider!);
      console.log('ACL Status:', aclStatus);
      
      let average: bigint | number;
      
      // Try user decryption if user has permission (alternative to public decryption)
      if (aclStatus.isAllowedForUser) {
        console.log('User has ACL permission, trying user decryption...');
        setState((prev) => ({ ...prev, txStatus: '🔑 Requesting user decryption (EIP712 signature required)...' }));
        
        const signer = await provider!.getSigner();
        const decryptedValue = await userDecrypt(handleHex, CONFIG.CONTRACT_ADDRESS, signer);
        console.log('User decryption result:', decryptedValue);
        
        average = typeof decryptedValue === 'bigint' ? decryptedValue : BigInt(decryptedValue as string);
        
      } else if (aclStatus.isPubliclyDecryptable) {
        console.log('Using public decryption...');
        setState((prev) => ({ ...prev, txStatus: '🔑 Requesting public decryption from Zama Relayer...' }));
        
        // Request public decryption via relayer-sdk
        const decryptResult = await publicDecrypt([handleHex]);
        console.log('Decryption result:', decryptResult);
        
        setState((prev) => ({ ...prev, txStatus: '✅ Verifying decryption proof on-chain...' }));
        
        // Submit proof to contract for verification
        const verifyTx = await contract!.verifyDecryption(
          decryptResult.abiEncodedClearValues,
          decryptResult.decryptionProof
        );
        await verifyTx.wait();
        
        // Get the verified average
        average = await contract!.getLastAverage(state.address);
        
      } else {
        throw new Error(`No decryption permission. ACL: isPubliclyDecryptable=${aclStatus.isPubliclyDecryptable}, isAllowedForUser=${aclStatus.isAllowedForUser}, isAllowedForContract=${aclStatus.isAllowedForContract}`);
      }
      
      setState((prev) => ({
        ...prev,
        lastAverage: Number(average),
        isLoading: false,
        txStatus: null,
      }));
      
      console.log('Real FHE: Average decrypted and verified!', { average: Number(average) });
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Request error:', error);
      console.error('Request error message:', error?.message);
      console.error('Request error stack:', error?.stack);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        txStatus: null,
        error: `Failed to request average: ${error?.message || 'Unknown error'}`,
      }));
    }
  };

  /**
   * Refresh contract state
   */
  const refreshState = useCallback(async () => {
    if (!contract || !state.address) return;

    try {
      const count = await contract.getCount();
      const hasSubmitted = await contract.hasUserSubmitted(state.address);
      const lastAverage = await contract.getLastAverage(state.address);

      setState((prev) => ({
        ...prev,
        count: Number(count),
        hasSubmitted: hasSubmitted,
        lastAverage: Number(lastAverage) > 0 ? Number(lastAverage) : prev.lastAverage,
      }));
    } catch (err) {
      console.error('Refresh error:', err);
    }
  }, [contract, state.address]);

  // Auto-refresh every 10 seconds when connected
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(refreshState, 10000);
    return () => clearInterval(interval);
  }, [state.isConnected, refreshState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-12">
        {/* Mode Banner */}
        {DEMO_MODE ? (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 mb-6 max-w-2xl mx-auto">
            <p className="text-yellow-300 text-center text-sm">
              🎬 <strong>Demo Mode</strong> - Simulating FHE encryption flow for demonstration purposes
            </p>
          </div>
        ) : (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 mb-6 max-w-2xl mx-auto">
            <p className="text-green-300 text-center text-sm">
              🔐 <strong>Real FHE Mode</strong> - Using Zama's FHE infrastructure on Sepolia Testnet
            </p>
          </div>
        )}

        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🔍 The Salary Lens
          </h1>
          <p className="text-xl text-blue-200">
            Privacy-Preserving Salary Aggregation with FHE
          </p>
        </header>

        {/* Main Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            {/* Connection Status */}
            {!state.isConnected ? (
              <div className="text-center">
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Connect Your Wallet
                  </h2>
                  <p className="text-blue-200 mb-6">
                    Connect to Sepolia Testnet to participate in private salary aggregation
                  </p>
                </div>
                <button
                  onClick={connectWallet}
                  disabled={state.isLoading}
                  className="px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold rounded-xl transition-all transform hover:scale-105 disabled:scale-100"
                >
                  {state.isLoading ? 'Connecting...' : 'Connect MetaMask'}
                </button>
              </div>
            ) : (
              <>
                {/* Connected State */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-blue-300">Connected</p>
                      <p className="text-white font-mono text-sm">
                        {state.address?.slice(0, 6)}...{state.address?.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-300">Network</p>
                      <p className="text-white">{CONFIG.NETWORK.name}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <p className="text-4xl font-bold text-white mb-1">{state.count}</p>
                      <p className="text-blue-300 text-sm">Salaries Submitted</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <p className="text-4xl font-bold text-white mb-1">
                        {state.lastAverage ? `$${state.lastAverage.toLocaleString()}` : '???'}
                      </p>
                      <p className="text-blue-300 text-sm">Average Salary</p>
                    </div>
                  </div>

                  {/* Encrypted Total Indicator */}
                  <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4 mb-6 border border-purple-500/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-purple-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">Encrypted Total</p>
                        <p className="text-purple-300 text-sm">
                          The sum of all salaries is encrypted and hidden on-chain
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-6">
                  {/* Submit Salary */}
                  {!state.hasSubmitted ? (
                    <div>
                      <label className="block text-blue-200 text-sm mb-2">
                        Your Salary (will be encrypted)
                      </label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            $
                          </span>
                          <input
                            type="number"
                            value={salary}
                            onChange={(e) => setSalary(e.target.value)}
                            placeholder="50000"
                            disabled={state.isLoading}
                            className="w-full pl-8 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          />
                        </div>
                        <button
                          onClick={handleSubmitSalary}
                          disabled={state.isLoading || !salary}
                          className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-semibold rounded-xl transition-all"
                        >
                          {state.isLoading ? 'Submitting...' : 'Submit'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-center">
                      <p className="text-green-300">
                        ✓ You have already submitted your salary
                      </p>
                    </div>
                  )}

                  {/* Request Average */}
                  <div>
                    <button
                      onClick={handleRequestAverage}
                      disabled={state.isLoading || state.count === 0}
                      className="w-full px-6 py-4 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white font-semibold rounded-xl transition-all"
                    >
                      {state.isLoading ? 'Processing...' : '🔓 Reveal Average Salary'}
                    </button>
                    {state.count === 0 && (
                      <p className="text-center text-yellow-300 text-sm mt-2">
                        No salaries have been submitted yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Transaction Status */}
                {state.txStatus && (
                  <div className="mt-6 bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                      <p className="text-blue-300">{state.txStatus}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Error Display */}
            {state.error && (
              <div className="mt-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-300">{state.error}</p>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-8 text-center text-blue-300 text-sm">
            <p className="mb-2">
              Powered by{' '}
              <a
                href="https://www.zama.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Zama's FHE Technology
              </a>
            </p>
            <p>
              Individual salaries remain encrypted on-chain. Only the average can be revealed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
