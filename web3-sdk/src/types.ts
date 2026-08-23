/**
 * @package @lithosprotocol/web3-sdk
 * @description Type definitions for LithosProtocol SDK
 */

import { BigNumberish, Contract, Signer, Provider, Wallet } from 'ethers';

// ========== NETWORK TYPES ==========

export type NetworkName = 'mainnet' | 'sepolia' | 'localhost' | string;

export interface NetworkConfig {
  name: NetworkName;
  rpcUrl: string;
  chainId: number;
}

// ========== CONTRACT ADDRESSES ==========

export interface ContractAddresses {
  governanceToken?: string;
  utilityToken?: string;
  gameAssetNFT?: string;
  gameResourceNFT?: string;
  gameLogic?: string;
  gameLogicV2?: string;
  marketplace?: string;
  marketplaceV2?: string;
  stakingContract?: string;
  vesting?: string;
  advancedTokenSinks?: string;
  dynamicTokenomics?: string;
  gameOracle?: string;
  playerDataStorage?: string;
  signatureVerifier?: string;
}

// ========== TOKEN TYPES ==========

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: BigNumberish;
  address: string;
}

export interface TokenBalance {
  governanceToken: BigNumberish;
  utilityToken: BigNumberish;
}

// ========== NFT TYPES ==========

export type AssetType = 'CHARACTER' | 'LAND' | 'WEAPON' | 'ARMOR' | 'ACCESSORY';
export type ResourceType = 'CRAFTING_MATERIAL' | 'POTION' | 'CONSUMABLE' | 'CURRENCY_ITEM';

export interface NFTAsset {
  tokenId: BigNumberish;
  assetType: AssetType;
  name: string;
  description: string;
  uri: string;
  level: number;
  rarity: number; // 1-5
  createdAt: BigNumberish;
  isStaked: boolean;
  owner: string;
}

export interface NFTResource {
  tokenId: BigNumberish;
  resourceType: ResourceType;
  name: string;
  description: string;
  rarity: number; // 1-5
  maxSupply: BigNumberish;
  balance: BigNumberish;
  isActive: boolean;
}

// ========== PLAYER TYPES ==========

export interface PlayerData {
  address: string;
  level: number;
  experience: BigNumberish;
  pvpWins: BigNumberish;
  pvpLosses: BigNumberish;
  pvpRating: BigNumberish;
  totalDamageDealt: BigNumberish;
  totalDamageTaken: BigNumberish;
  isActive: boolean;
  lastActivityTime: BigNumberish;
  assets: NFTAsset[];
  resources: NFTResource[];
  tokenBalances: TokenBalance;
}

export interface PlayerStats {
  totalQuestsCompleted: BigNumberish;
  totalCrafted: BigNumberish;
  totalItemsCrafted: BigNumberish;
  longestWinStreak: BigNumberish;
  currentWinStreak: BigNumberish;
}

// ========== QUEST TYPES ==========

export interface Quest {
  questId: BigNumberish;
  name: string;
  description: string;
  baseRewardAmount: BigNumberish;
  requiredLevel: number;
  objectives: BigNumberish[];
  isActive: boolean;
  isDaily: boolean;
  progress?: number; // 0-100
}

// ========== CRAFTING TYPES ==========

export interface CraftingRecipe {
  recipeId: BigNumberish;
  name: string;
  assetType: AssetType;
  requiredLevel: number;
  baseCost: BigNumberish;
  resourceIds: BigNumberish[];
  resourceAmounts: BigNumberish[];
  successRate: number; // 0-10000 (percentage * 100)
  isActive: boolean;
}

export interface UpgradeRecipe {
  recipeId: BigNumberish;
  targetAssetType: AssetType;
  fromRarity: number;
  toRarity: number;
  requiredLevel: number;
  resourceIds: BigNumberish[];
  resourceAmounts: BigNumberish[];
  cost: BigNumberish;
  isActive: boolean;
}

// ========== MARKETPLACE TYPES ==========

export type ListingType = 'FIXED_PRICE' | 'AUCTION' | 'DUTCH_AUCTION';
export type AssetTypeFilter = 'ERC721' | 'ERC1155';

export interface Listing {
  listingId: BigNumberish;
  seller: string;
  nftContract: string;
  tokenId: BigNumberish;
  amount: BigNumberish;
  assetType: AssetTypeFilter;
  listingType: ListingType;
  paymentToken: string;
  price: BigNumberish;
  endPrice?: BigNumberish; // For Dutch auctions
  endTime: BigNumberish;
  isActive: boolean;
  highestBidder?: string;
  highestBid?: BigNumberish;
  metadata?: ListingMetadata;
}

export interface ListingMetadata {
  name: string;
  description: string;
  categoryId: BigNumberish;
  rarity: number;
  level: number;
  isVerified: boolean;
}

export interface BulkListing {
  bulkId: BigNumberish;
  seller: string;
  nftContract: string;
  tokenIds: BigNumberish[];
  amounts: BigNumberish[];
  listingType: ListingType;
  paymentToken: string;
  pricePerItem: BigNumberish;
  endTime: BigNumberish;
  isActive: boolean;
  itemsSold: BigNumberish;
}

export interface DutchAuctionInfo {
  startingPrice: BigNumberish;
  endingPrice: BigNumberish;
  startTime: BigNumberish;
  endTime: BigNumberish;
  isActive: boolean;
  currentPrice: BigNumberish;
}

// ========== STAKING TYPES ==========

export type PoolType = 'TOKEN_STAKING' | 'NFT_STAKING';

export interface StakingPool {
  poolId: BigNumberish;
  poolType: PoolType;
  stakingToken: string;
  rewardRate: BigNumberish;
  lockPeriod: BigNumberish;
  totalStaked: BigNumberish;
  isActive: boolean;
  maxStakePerUser: BigNumberish;
}

export interface UserStake {
  amount: BigNumberish;
  stakedAt: BigNumberish;
  lockUntil: BigNumberish;
  rewards: BigNumberish;
  stakedTokenIds: BigNumberish[];
}

// ========== VESTING TYPES ==========

export type AllocationType = 'TEAM' | 'INVESTOR' | 'COMMUNITY' | 'ADVISOR' | 'RESERVE';

export interface VestingSchedule {
  scheduleId: BigNumberish;
  beneficiary: string;
  totalAmount: BigNumberish;
  vestedAmount: BigNumberish;
  startTime: BigNumberish;
  cliffDuration: BigNumberish;
  vestingDuration: BigNumberish;
  isActive: boolean;
  allocationName: string;
  allocationType: AllocationType;
}

// ========== BATTLE TYPES ==========

export interface Battle {
  battleId: string;
  player1: string;
  player2: string;
  player1Damage: BigNumberish;
  player2Damage: BigNumberish;
  player1Health: BigNumberish;
  player2Health: BigNumberish;
  startTime: BigNumberish;
  isActive: boolean;
  winner?: string;
  ratingChange?: BigNumberish;
}

// ========== SDK CONFIGURATION ==========

export interface LithosProtocolSDKConfig {
  network: NetworkName | NetworkConfig;
  contracts?: ContractAddresses;
  provider?: Provider;
  signer?: Signer;
  privateKey?: string;
  debug?: boolean;
}

// ========== EVENT TYPES ==========

export interface SDKEventMap {
  'playerRegistered': (player: string) => void;
  'questCompleted': (player: string, questId: BigNumberish, reward: BigNumberish) => void;
  'pvpResult': (winner: string, loser: string, reward: BigNumberish, ratingChange: BigNumberish) => void;
  'battleStarted': (battleId: string, player1: string, player2: string) => void;
  'battleResolved': (battleId: string, winner: string, loser: string) => void;
  'itemCrafted': (player: string, tokenId: BigNumberish, recipeId: BigNumberish, cost: BigNumberish) => void;
  'craftingFailed': (player: string, recipeId: BigNumberish, costLost: BigNumberish) => void;
  'itemUpgraded': (player: string, tokenId: BigNumberish, fromRarity: number, toRarity: number) => void;
  'itemListed': (listingId: BigNumberish, seller: string, nftContract: string, tokenId: BigNumberish) => void;
  'itemSold': (listingId: BigNumberish, seller: string, buyer: string, price: BigNumberish) => void;
  'bidPlaced': (listingId: BigNumberish, bidder: string, amount: BigNumberish) => void;
  'auctionEnded': (listingId: BigNumberish, winner: string, winningBid: BigNumberish) => void;
  'tokensStaked': (user: string, poolId: BigNumberish, amount: BigNumberish) => void;
  'rewardsClaimed': (user: string, poolId: BigNumberish, amount: BigNumberish) => void;
}

// ========== SEARCH FILTER TYPES ==========

export interface SearchFilters {
  categoryId?: BigNumberish;
  minRarity?: number;
  maxRarity?: number;
  isVerified?: boolean;
  minPrice?: BigNumberish;
  maxPrice?: BigNumberish;
  seller?: string;
  listingType?: ListingType;
  assetType?: AssetTypeFilter;
}

export interface SearchResult {
  listings: Listing[];
  total: number;
  page: number;
  pageSize: number;
}

// ========== ERROR TYPES ==========

export class SDKError extends Error {
  constructor(message: string, public readonly code: number) {
    super(message);
    this.name = 'SDKError';
  }
}

export class NotConnectedError extends SDKError {
  constructor() {
    super('Not connected to a provider', 1001);
  }
}

export class NotSignedInError extends SDKError {
  constructor() {
    super('No signer available. Please connect a wallet.', 1002);
  }
}

export class ContractNotFoundError extends SDKError {
  constructor(contractName: string) {
    super(`Contract ${contractName} not found or address not provided`, 2001);
  }
}

export class InvalidNetworkError extends SDKError {
  constructor(expected: string, actual: string) {
    super(`Invalid network. Expected ${expected}, got ${actual}`, 3001);
  }
}

export class InsufficientBalanceError extends SDKError {
  constructor(token: string, required: BigNumberish, available: BigNumberish) {
    super(`Insufficient ${token} balance. Required: ${required}, Available: ${available}`, 4001);
  }
}

export class ApprovalRequiredError extends SDKError {
  constructor(contract: string, spender: string) {
    super(`Approval required for ${contract}. Please approve ${spender} to spend your tokens.`, 4002);
  }
}
