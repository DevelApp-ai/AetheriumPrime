/**
 * @package @lithosprotocol/web3-sdk
 * @description Utility functions for LithosProtocol SDK
 */

import { ethers, BigNumberish, formatEther, formatUnits, parseEther, parseUnits } from 'ethers';
import {
  NetworkName,
  NetworkConfig,
  ContractAddresses,
  AllocationType,
  AssetType,
  ResourceType,
  ListingType
} from './types';

// ========== NETWORK UTILITIES ==========

/**
 * Predefined network configurations
 */
export const NETWORKS: Record<NetworkName, NetworkConfig> = {
  mainnet: {
    name: 'mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/${INFURA_KEY}',
    chainId: 1
  },
  sepolia: {
    name: 'sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/${INFURA_KEY}',
    chainId: 11155111
  },
  localhost: {
    name: 'localhost',
    rpcUrl: 'http://localhost:8545',
    chainId: 31337
  }
};

/**
 * Get network configuration by name or chain ID
 */
export function getNetworkConfig(network: NetworkName | number): NetworkConfig {
  if (typeof network === 'number') {
    for (const [name, config] of Object.entries(NETWORKS)) {
      if (config.chainId === network) {
        return config;
      }
    }
    throw new Error(`Network with chainId ${network} not found`);
  }
  
  if (NETWORKS[network]) {
    return NETWORKS[network];
  }
  
  throw new Error(`Network ${network} not found`);
}

/**
 * Get RPC URL for a network
 */
export function getRpcUrl(network: NetworkName): string {
  return NETWORKS[network]?.rpcUrl || NETWORKS.sepolia.rpcUrl;
}

// ========== ADDRESS UTILITIES ==========

/**
 * Default contract addresses for Sepolia testnet
 */
export const SEPOLIA_ADDRESSES: ContractAddresses = {
  governanceToken: '0x123...', // Placeholder - replace with actual deployed addresses
  utilityToken: '0x456...',
  gameAssetNFT: '0x789...',
  gameResourceNFT: '0xabc...',
  gameLogic: '0xdef...',
  gameLogicV2: '0xghi...',
  marketplace: '0xjkl...',
  marketplaceV2: '0xmno...',
  stakingContract: '0xpqr...',
  vesting: '0xstu...',
  advancedTokenSinks: '0xvwx...',
  dynamicTokenomics: '0xyza...',
  gameOracle: '0x111...',
  playerDataStorage: '0x222...',
  signatureVerifier: '0x333...'
};

/**
 * Default contract addresses for Localhost
 */
export const LOCALHOST_ADDRESSES: ContractAddresses = {
  governanceToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  utilityToken: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  gameAssetNFT: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  gameResourceNFT: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  gameLogic: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  gameLogicV2: '0x610178dA211FEF7D417bA05843B834654459D4b5',
  marketplace: '0xA51c1fc2f0D1a1b84E44590114a605A766324834',
  marketplaceV2: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe7',
  stakingContract: '0x8A791620dd6260079586490530b4fF5c95526CC',
  vesting: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  advancedTokenSinks: '0x90F79bf6EB2c4f870365E78594720a97dD935482',
  dynamicTokenomics: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  gameOracle: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  playerDataStorage: '0x6813E619594f963744375502d220270940337970',
  signatureVerifier: '0x742d35Cc6634C0532925a3b8D11b90fD29a8024d'
};

/**
 * Get contract addresses for a network
 */
export function getContractAddresses(network: NetworkName): ContractAddresses {
  switch (network) {
    case 'sepolia':
      return SEPOLIA_ADDRESSES;
    case 'localhost':
      return LOCALHOST_ADDRESSES;
    default:
      // For mainnet or custom networks, return empty (user must provide)
      return {};
  }
}

/**
 * Merge user-provided addresses with defaults
 */
export function mergeAddresses(
  defaults: ContractAddresses,
  overrides: ContractAddresses = {}
): ContractAddresses {
  return { ...defaults, ...overrides };
}

// ========== FORMATTING UTILITIES ==========

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: BigNumberish, decimals: number = 18): string {
  return formatUnits(amount, decimals);
}

/**
 * Format ETH amount for display
 */
export function formatEthAmount(amount: BigNumberish): string {
  return formatEther(amount);
}

/**
 * Parse token amount from string
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return parseUnits(amount, decimals);
}

/**
 * Parse ETH amount from string
 */
export function parseEthAmount(amount: string): bigint {
  return parseEther(amount);
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Check if address is valid
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T> | T,
  maxRetries: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      await sleep(delay);
      delay *= backoff;
    }
  }
  
  throw new Error('Max retries exceeded');
}

// ========== TYPE CONVERSION UTILITIES ==========

/**
 * Convert AssetType string to enum value
 */
export function stringToAssetType(type: string): AssetType {
  const typeMap: Record<string, AssetType> = {
    CHARACTER: 'CHARACTER',
    LAND: 'LAND',
    WEAPON: 'WEAPON',
    ARMOR: 'ARMOR',
    ACCESSORY: 'ACCESSORY'
  };
  return typeMap[type.toUpperCase()] || 'CHARACTER';
}

/**
 * Convert ResourceType string to enum value
 */
export function stringToResourceType(type: string): ResourceType {
  const typeMap: Record<string, ResourceType> = {
    CRAFTING_MATERIAL: 'CRAFTING_MATERIAL',
    POTION: 'POTION',
    CONSUMABLE: 'CONSUMABLE',
    CURRENCY_ITEM: 'CURRENCY_ITEM'
  };
  return typeMap[type.toUpperCase()] || 'CRAFTING_MATERIAL';
}

/**
 * Convert ListingType string to enum value
 */
export function stringToListingType(type: string): ListingType {
  const typeMap: Record<string, ListingType> = {
    FIXED_PRICE: 'FIXED_PRICE',
    AUCTION: 'AUCTION',
    DUTCH_AUCTION: 'DUTCH_AUCTION'
  };
  return typeMap[type.toUpperCase()] || 'FIXED_PRICE';
}

/**
 * Convert AllocationType string to enum value
 */
export function stringToAllocationType(type: string): AllocationType {
  const typeMap: Record<string, AllocationType> = {
    TEAM: 'TEAM',
    INVESTOR: 'INVESTOR',
    COMMUNITY: 'COMMUNITY',
    ADVISOR: 'ADVISOR',
    RESERVE: 'RESERVE'
  };
  return typeMap[type.toUpperCase()] || 'TEAM';
}

/**
 * Convert number to AssetType
 */
export function numberToAssetType(num: number): AssetType {
  const types: AssetType[] = ['CHARACTER', 'LAND', 'WEAPON', 'ARMOR', 'ACCESSORY'];
  return types[num] || 'CHARACTER';
}

/**
 * Convert number to ResourceType
 */
export function numberToResourceType(num: number): ResourceType {
  const types: ResourceType[] = ['CRAFTING_MATERIAL', 'POTION', 'CONSUMABLE', 'CURRENCY_ITEM'];
  return types[num] || 'CRAFTING_MATERIAL';
}

/**
 * Convert number to ListingType
 */
export function numberToListingType(num: number): ListingType {
  const types: ListingType[] = ['FIXED_PRICE', 'AUCTION', 'DUTCH_AUCTION'];
  return types[num] || 'FIXED_PRICE';
}

// ========== CONSTANTS ==========

export const DEFAULT_GAS_LIMIT = 5000000;
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const MAX_UINT256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// ========== DEBUG UTILITIES ==========

/**
 * Debug logger
 */
export class DebugLogger {
  private prefix: string;
  private enabled: boolean;
  
  constructor(prefix: string = 'LithosSDK', enabled: boolean = false) {
    this.prefix = prefix;
    this.enabled = enabled;
  }
  
  log(...args: any[]): void {
    if (this.enabled) {
      console.log(`[${this.prefix}]`, ...args);
    }
  }
  
  error(...args: any[]): void {
    if (this.enabled) {
      console.error(`[${this.prefix}]`, ...args);
    }
  }
  
  warn(...args: any[]): void {
    if (this.enabled) {
      console.warn(`[${this.prefix}]`, ...args);
    }
  }
  
  debug(...args: any[]): void {
    if (this.enabled) {
      console.debug(`[${this.prefix}]`, ...args);
    }
  }
}
