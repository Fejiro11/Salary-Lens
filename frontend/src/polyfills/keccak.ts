/**
 * Browser-compatible keccak polyfill using js-sha3
 */
import { keccak256, keccak384, keccak512 } from 'js-sha3';

class Keccak {
  private algorithm: string;
  private data: string[] = [];

  constructor(bits: number) {
    this.algorithm = `keccak${bits}`;
  }

  update(data: Buffer | Uint8Array | string): this {
    if (typeof data === 'string') {
      this.data.push(data);
    } else {
      // Convert Uint8Array/Buffer to hex string
      this.data.push(Array.from(new Uint8Array(data)).map(b => String.fromCharCode(b)).join(''));
    }
    return this;
  }

  digest(encoding?: 'hex' | 'binary'): Buffer | string {
    const input = this.data.join('');
    let hashFn: (message: string) => string;
    
    switch (this.algorithm) {
      case 'keccak384':
        hashFn = keccak384;
        break;
      case 'keccak512':
        hashFn = keccak512;
        break;
      default:
        hashFn = keccak256;
    }

    const hexHash = hashFn(input);

    if (encoding === 'hex') {
      return hexHash;
    }
    
    // Convert hex to Buffer
    const bytes = new Uint8Array(hexHash.length / 2);
    for (let i = 0; i < hexHash.length; i += 2) {
      bytes[i / 2] = parseInt(hexHash.substr(i, 2), 16);
    }
    return Buffer.from(bytes);
  }
}

function createKeccakHash(bits: number | string) {
  const bitNum = typeof bits === 'string' ? parseInt(bits.replace('keccak', ''), 10) : bits;
  return new Keccak(bitNum);
}

// Export as default and named
export default createKeccakHash;
export { createKeccakHash as keccak };
