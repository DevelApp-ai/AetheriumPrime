/**
 * @package @lithosprotocol/web3-sdk
 * @description Main SDK class for LithosProtocol
 */

import { ethers, Contract, Signer, Provider, Wallet, JsonRpcProvider, BrowserProvider } from 'ethers';
import {
  LithosProtocolSDKConfig,
  NetworkName,
  NetworkConfig,
  ContractAddresses,
  PlayerData,
  PlayerStats,
  TokenInfo,
  TokenBalance,
  NFTAsset,
  NFTResource,
  Quest,
  CraftingRecipe,
  UpgradeRecipe,
  Listing,
  BulkListing,
  DutchAuctionInfo,
  StakingPool,
  UserStake,
  VestingSchedule,
  Battle,
  SearchFilters,
  SearchResult,
  SDKEventMap,
  NotConnectedError,
  NotSignedInError,
  ContractNotFoundError,
  InvalidNetworkError,
  InsufficientBalanceError,
  ApprovalRequiredError,
  SDKError
} from './types';
import {
  getNetworkConfig,
  getRpcUrl,
  getContractAddresses,
  mergeAddresses,
  formatTokenAmount,
  formatEthAmount,
  parseTokenAmount,
  parseEthAmount,
  shortenAddress,
  isValidAddress,
  retry,
  DEFAULT_GAS_LIMIT,
  DEFAULT_TIMEOUT,
  ZERO_ADDRESS,
  DebugLogger
} from './utils';

// Contract ABIs (simplified for SDK - in production, use full ABIs)
import * as ContractABIs from './contracts/abis';

// ========== SDK INTERFACES ==========

/**
 * Event emitter type for SDK events
 */
export type SDKEventEmitter = {
  on<K extends keyof SDKEventMap>(event: K, listener: SDKEventMap[K]): void;
  off<K extends keyof SDKEventMap>(event: K, listener: SDKEventMap[K]): void;
  emit<K extends keyof SDKEventMap>(event: K, ...args: Parameters<SDKEventMap[K]>): void;
};

/**
 * Main SDK class for interacting with LithosProtocol
 */
export class LithosProtocolSDK {
  // Configuration
  public config: LithosProtocolSDKConfig;
  
  // Network and provider
  public network: NetworkConfig;
  public provider: Provider | null = null;
  public signer: Signer | null = null;
  
  // Contract addresses
  public addresses: ContractAddresses;
  
  // Contract instances (lazy loaded)
  private _contracts: Map<string, Contract> = new Map();
  
  // Logger
  public logger: DebugLogger;
  
  // Event listeners
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  
  // Modules (lazy initialized)
  private _playerModule: PlayerModule | null = null;
  private _tokenModule: TokenModule | null = null;
  private _nftModule: NFTModule | null = null;
  private _gameModule: GameModule | null = null;
  private _marketplaceModule: MarketplaceModule | null = null;
  private _stakingModule: StakingModule | null = null;
  private _vestingModule: VestingModule | null = null;

  // ========== CONSTRUCTOR ==========

  constructor(config: Partial<LithosProtocolSDKConfig> = {}) {
    // Initialize configuration
    this.config = {
      network: 'localhost',
      debug: false,
      ...config
    };
    
    // Initialize logger
    this.logger = new DebugLogger('LithosSDK', this.config.debug || false);
    
    // Initialize network
    if (typeof this.config.network === 'string') {
      this.network = getNetworkConfig(this.config.network);
    } else {
      this.network = this.config.network;
    }
    
    // Initialize provider
    this.initializeProvider();
    
    // Initialize addresses
    const defaultAddresses = getContractAddresses(this.network.name as NetworkName);
    this.addresses = mergeAddresses(defaultAddresses, this.config.contracts || {});
    
    // Set up signer if provided
    if (this.config.signer) {
      this.signer = this.config.signer;
    } else if (this.config.privateKey) {
      this.signer = new Wallet(this.config.privateKey, this.provider);
    }
    
    this.logger.log(`SDK initialized for network: ${this.network.name}`);
  }

  // ========== PROVIDER MANAGEMENT ==========

  private initializeProvider(): void {
    if (this.config.provider) {
      this.provider = this.config.provider;
    } else {
      // Create default provider based on network
      const rpcUrl = this.config.network === 'localhost' 
        ? 'http://localhost:8545' 
        : getRpcUrl(this.network.name as NetworkName);
      
      this.provider = new JsonRpcProvider(rpcUrl);
    }
  }

  /**
   * Connect to a wallet (browser environment)
   */
  async connectWallet(provider: any): Promise<void> {
    if (!provider) {
      throw new NotConnectedError();
    }
    
    this.provider = new BrowserProvider(provider);
    this.signer = await this.provider.getSigner();
    
    // Verify network
    const network = await this.provider.getNetwork();
    if (network.chainId !== BigInt(this.network.chainId)) {
      throw new InvalidNetworkError(
        this.network.chainId.toString(),
        network.chainId.toString()
      );
    }
    
    this.logger.log('Wallet connected');
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet(): void {
    this.signer = null;
    this.provider = null;
    this._contracts.clear();
    this.logger.log('Wallet disconnected');
  }

  /**
   * Check if wallet is connected
   */
  get isConnected(): boolean {
    return this.provider !== null;
  }

  /**
   * Check if signer is available
   */
  get isSignedIn(): boolean {
    return this.signer !== null;
  }

  /**
   * Get current wallet address
   */
  async getAddress(): Promise<string> {
    if (!this.signer) {
      throw new NotSignedInError();
    }
    return await this.signer.getAddress();
  }

  /**
   * Get current network
   */
  getCurrentNetwork(): NetworkConfig {
    return this.network;
  }

  // ========== CONTRACT MANAGEMENT ==========

  /**
   * Get a contract instance
   */
  getContract(contractName: string): Contract {
    const address = (this.addresses as any)[contractName];
    if (!address || address === ZERO_ADDRESS) {
      throw new ContractNotFoundError(contractName);
    }
    
    const cacheKey = `${contractName}_${address}`;
    if (this._contracts.has(cacheKey)) {
      return this._contracts.get(cacheKey)!;
    }
    
    if (!this.provider) {
      throw new NotConnectedError();
    }
    
    const abi = (ContractABIs as any)[contractName] || [];
    const contract = new Contract(address, abi, this.signer || this.provider);
    this._contracts.set(cacheKey, contract);
    
    return contract;
  }

  /**
   * Set custom contract address
   */
  setContractAddress(contractName: string, address: string): void {
    (this.addresses as any)[contractName] = address;
    // Clear cached contract
    const cacheKey = `${contractName}_${(this.addresses as any)[contractName]}`;
    this._contracts.delete(cacheKey);
  }

  // ========== MODULE ACCESSORS ==========

  /**
   * Get Player module
   */
  get player(): PlayerModule {
    if (!this._playerModule) {
      this._playerModule = new PlayerModule(this);
    }
    return this._playerModule;
  }

  /**
   * Get Token module
   */
  get token(): TokenModule {
    if (!this._tokenModule) {
      this._tokenModule = new TokenModule(this);
    }
    return this._tokenModule;
  }

  /**
   * Get NFT module
   */
  get nft(): NFTModule {
    if (!this._nftModule) {
      this._nftModule = new NFTModule(this);
    }
    return this._nftModule;
  }

  /**
   * Get Game module
   */
  get game(): GameModule {
    if (!this._gameModule) {
      this._gameModule = new GameModule(this);
    }
    return this._gameModule;
  }

  /**
   * Get Marketplace module
   */
  get marketplace(): MarketplaceModule {
    if (!this._marketplaceModule) {
      this._marketplaceModule = new MarketplaceModule(this);
    }
    return this._marketplaceModule;
  }

  /**
   * Get Staking module
   */
  get staking(): StakingModule {
    if (!this._stakingModule) {
      this._stakingModule = new StakingModule(this);
    }
    return this._stakingModule;
  }

  /**
   * Get Vesting module
   */
  get vesting(): VestingModule {
    if (!this._vestingModule) {
      this._vestingModule = new VestingModule(this);
    }
    return this._vestingModule;
  }

  // ========== EVENT SYSTEM ==========

  /**
   * Subscribe to SDK events
   */
  on<K extends keyof SDKEventMap>(event: K, listener: SDKEventMap[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener as any);
  }

  /**
   * Unsubscribe from SDK events
   */
  off<K extends keyof SDKEventMap>(event: K, listener: SDKEventMap[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener as any);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit SDK event
   */
  emit<K extends keyof SDKEventMap>(event: K, ...args: Parameters<SDKEventMap[K]>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          this.logger.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Execute a transaction with retry logic
   */
  async executeTx(
    txPromise: Promise<any>,
    options: { 
      gasLimit?: BigNumberish;
      maxRetries?: number;
      onSuccess?: (txHash: string) => void;
      onError?: (error: any) => void;
    } = {}
  ): Promise<any> {
    const { gasLimit, maxRetries = 3, onSuccess, onError } = options;
    
    try {
      const tx = await retry(() => txPromise, maxRetries);
      
      if (onSuccess) {
        onSuccess(tx.hash);
      }
      
      return await tx.wait();
    } catch (error) {
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(method: string, args: any[] = [], contractName?: string): Promise<bigint> {
    let contract: Contract;
    
    if (contractName) {
      contract = this.getContract(contractName);
    } else {
      // Try to infer from method
      throw new Error('Contract name required for gas estimation');
    }
    
    const methodFn = (contract as any)[method];
    if (!methodFn) {
      throw new Error(`Method ${method} not found on contract ${contractName}`);
    }
    
    try {
      const gasEstimate = await methodFn.estimateGas(...args);
      return gasEstimate;
    } catch (error) {
      this.logger.error(`Gas estimation failed for ${contractName}.${method}:`, error);
      return BigInt(DEFAULT_GAS_LIMIT);
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<any> {
    if (!this.provider) {
      throw new NotConnectedError();
    }
    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(txHash: string, confirmations: number = 1): Promise<any> {
    if (!this.provider) {
      throw new NotConnectedError();
    }
    
    const receipt = await this.provider.waitForTransaction(txHash, confirmations);
    return receipt;
  }
}

// ========== MODULE CLASSES ==========

// ===== PLAYER MODULE =====

export class PlayerModule {
  private sdk: LithosProtocolSDK;
  
  constructor(sdk: LithosProtocolSDK) {
    this.sdk = sdk;
  }

  /**
   * Register a new player
   */
  async registerPlayer(referrer?: string): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const gameLogic = this.sdk.getContract('gameLogic');
    const tx = await gameLogic.registerPlayer(referrer || ZERO_ADDRESS);
    await tx.wait();
    
    this.sdk.emit('playerRegistered', await this.sdk.signer.getAddress());
    return tx.hash;
  }

  /**
   * Get player data
   */
  async getPlayerData(address?: string): Promise<PlayerData> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const gameLogic = this.sdk.getContract('gameLogic');
    const playerData = await gameLogic.getPlayerData(targetAddress);
    
    // Transform and return data
    return this.transformPlayerData(playerData, targetAddress);
  }

  /**
   * Get player stats
   */
  async getPlayerStats(address?: string): Promise<PlayerStats> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const playerDataStorage = this.sdk.getContract('playerDataStorage');
    const stats = await playerDataStorage.getPlayerStats(targetAddress);
    
    return {
      totalQuestsCompleted: stats.totalQuestsCompleted,
      totalCrafted: stats.totalCrafted,
      totalItemsCrafted: stats.totalItemsCrafted,
      longestWinStreak: stats.longestWinStreak,
      currentWinStreak: stats.currentWinStreak
    };
  }

  /**
   * Check if player is registered
   */
  async isPlayerRegistered(address?: string): Promise<boolean> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      return false;
    }
    
    const gameLogic = this.sdk.getContract('gameLogic');
    return await gameLogic.isPlayerRegistered(targetAddress);
  }

  /**
   * Get player balance (tokens and NFTs)
   */
  async getPlayerBalance(address?: string): Promise<{
    tokens: TokenBalance;
    assets: NFTAsset[];
    resources: NFTResource[];
  }> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const [tokens, assets, resources] = await Promise.all([
      this.sdk.token.getTokenBalances(targetAddress),
      this.sdk.nft.getPlayerAssets(targetAddress),
      this.sdk.nft.getPlayerResources(targetAddress)
    ]);
    
    return { tokens, assets, resources };
  }

  private transformPlayerData(data: any, address: string): PlayerData {
    return {
      address,
      level: Number(data.level),
      experience: data.experience,
      pvpWins: data.pvpWins,
      pvpLosses: data.pvpLosses,
      pvpRating: data.pvpRating,
      totalDamageDealt: data.totalDamageDealt,
      totalDamageTaken: data.totalDamageTaken,
      isActive: data.isActive,
      lastActivityTime: data.lastActivityTime,
      assets: [],
      resources: [],
      tokenBalances: { governanceToken: 0n, utilityToken: 0n }
    };
  }
}

// ===== TOKEN MODULE =====

export class TokenModule {
  private sdk: LithosProtocolSDK;
  
  constructor(sdk: LithosProtocolSDK) {
    this.sdk = sdk;
  }

  /**
   * Get governance token contract
   */
  getGovernanceTokenContract(): Contract {
    return this.sdk.getContract('governanceToken');
  }

  /**
   * Get utility token contract
   */
  getUtilityTokenContract(): Contract {
    return this.sdk.getContract('utilityToken');
  }

  /**
   * Get token info
   */
  async getTokenInfo(tokenType: 'governance' | 'utility'): Promise<TokenInfo> {
    const contract = tokenType === 'governance' 
      ? this.getGovernanceTokenContract() 
      : this.getUtilityTokenContract();
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ]);
    
    return {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply,
      address: contract.target as string
    };
  }

  /**
   * Get token balance for an address
   */
  async getBalance(tokenType: 'governance' | 'utility', address?: string): Promise<bigint> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const contract = tokenType === 'governance' 
      ? this.getGovernanceTokenContract() 
      : this.getUtilityTokenContract();
    
    return await contract.balanceOf(targetAddress);
  }

  /**
   * Get token balances for both tokens
   */
  async getTokenBalances(address?: string): Promise<TokenBalance> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const [governance, utility] = await Promise.all([
      this.getBalance('governance', targetAddress),
      this.getBalance('utility', targetAddress)
    ]);
    
    return {
      governanceToken: governance,
      utilityToken: utility
    };
  }

  /**
   * Transfer tokens
   */
  async transfer(
    tokenType: 'governance' | 'utility',
    to: string,
    amount: BigNumberish
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    if (!isValidAddress(to)) {
      throw new Error('Invalid recipient address');
    }
    
    const contract = tokenType === 'governance' 
      ? this.getGovernanceTokenContract() 
      : this.getUtilityTokenContract();
    
    const tx = await contract.transfer(to, amount);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Approve token spending
   */
  async approve(
    tokenType: 'governance' | 'utility',
    spender: string,
    amount: BigNumberish
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    if (!isValidAddress(spender)) {
      throw new Error('Invalid spender address');
    }
    
    const contract = tokenType === 'governance' 
      ? this.getGovernanceTokenContract() 
      : this.getUtilityTokenContract();
    
    const tx = await contract.approve(spender, amount);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Get allowance
   */
  async getAllowance(
    tokenType: 'governance' | 'utility',
    owner: string,
    spender: string
  ): Promise<bigint> {
    const contract = tokenType === 'governance' 
      ? this.getGovernanceTokenContract() 
      : this.getUtilityTokenContract();
    
    return await contract.allowance(owner, spender);
  }

  /**
   * Check if approval is needed
   */
  async needsApproval(
    tokenType: 'governance' | 'utility',
    spender: string,
    amount: BigNumberish
  ): Promise<boolean> {
    const address = this.sdk.signer ? await this.sdk.signer.getAddress() : undefined;
    if (!address) {
      throw new NotSignedInError();
    }
    
    const allowance = await this.getAllowance(tokenType, address, spender);
    return allowance < BigInt(amount);
  }
}

// ===== NFT MODULE =====

export class NFTModule {
  private sdk: LithosProtocolSDK;
  
  constructor(sdk: LithosProtocolSDK) {
    this.sdk = sdk;
  }

  /**
   * Get game asset NFT contract
   */
  getGameAssetNFTContract(): Contract {
    return this.sdk.getContract('gameAssetNFT');
  }

  /**
   * Get game resource NFT contract
   */
  getGameResourceNFTContract(): Contract {
    return this.sdk.getContract('gameResourceNFT');
  }

  /**
   * Mint a new game asset
   */
  async mintAsset(
    assetType: number,
    uri: string,
    level: number,
    rarity: number
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getGameAssetNFTContract();
    const tx = await contract.mint(assetType, uri, level, rarity);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Mint game resources
   */
  async mintResources(
    resourceIds: BigNumberish[],
    amounts: BigNumberish[]
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getGameResourceNFTContract();
    const tx = await contract.mintBatch(
      await this.sdk.signer.getAddress(),
      resourceIds,
      amounts,
      '0x'
    );
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Get player's assets
   */
  async getPlayerAssets(address?: string): Promise<NFTAsset[]> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const contract = this.getGameAssetNFTContract();
    const balance = await contract.balanceOf(targetAddress);
    const assets: NFTAsset[] = [];
    
    for (let i = 0; i < Number(balance); i++) {
      try {
        const tokenId = await contract.tokenOfOwnerByIndex(targetAddress, i);
        const asset = await this.getAsset(tokenId);
        assets.push(asset);
      } catch (error) {
        // Token might have been transferred
        continue;
      }
    }
    
    return assets;
  }

  /**
   * Get player's resources
   */
  async getPlayerResources(address?: string): Promise<NFTResource[]> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const contract = this.getGameResourceNFTContract();
    // This is a simplified implementation
    // In production, you'd need to track which resource IDs the player has
    return [];
  }

  /**
   * Get asset details
   */
  async getAsset(tokenId: BigNumberish): Promise<NFTAsset> {
    const contract = this.getGameAssetNFTContract();
    const uri = await contract.tokenURI(tokenId);
    const owner = await contract.ownerOf(tokenId);
    
    // In production, you'd decode the URI or fetch metadata
    return {
      tokenId,
      assetType: 'CHARACTER', // Placeholder
      name: `Asset ${tokenId}`,
      description: '',
      uri,
      level: 1,
      rarity: 1,
      createdAt: 0n,
      isStaked: false,
      owner
    };
  }

  /**
   * Transfer asset
   */
  async transferAsset(
    to: string,
    tokenId: BigNumberish
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    if (!isValidAddress(to)) {
      throw new Error('Invalid recipient address');
    }
    
    const contract = this.getGameAssetNFTContract();
    const tx = await contract.transferFrom(
      await this.sdk.signer.getAddress(),
      to,
      tokenId
    );
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Approve asset spending
   */
  async approveAsset(
    spender: string,
    tokenId: BigNumberish
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getGameAssetNFTContract();
    const tx = await contract.approve(spender, tokenId);
    await tx.wait();
    
    return tx.hash;
  }
}

// ===== GAME MODULE =====

export class GameModule {
  private sdk: LithosProtocolSDK;
  
  constructor(sdk: LithosProtocolSDK) {
    this.sdk = sdk;
  }

  /**
   * Get game logic contract (use V2 if available)
   */
  getGameLogicContract(): Contract {
    try {
      return this.sdk.getContract('gameLogicV2');
    } catch {
      return this.sdk.getContract('gameLogic');
    }
  }

  /**
   * Get all available quests
   */
  async getQuests(): Promise<Quest[]> {
    const contract = this.getGameLogicContract();
    const questsCount = await contract.getQuestsCount();
    const quests: Quest[] = [];
    
    for (let i = 0; i < Number(questsCount); i++) {
      const quest = await contract.getQuest(i);
      quests.push(this.transformQuest(quest, i));
    }
    
    return quests;
  }

  /**
   * Get active quests for a player
   */
  async getPlayerQuests(address?: string): Promise<Quest[]> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const contract = this.getGameLogicContract();
    const activeQuests = await contract.getPlayerActiveQuests(targetAddress);
    
    return activeQuests.map((q: any, i: number) => this.transformQuest(q, i));
  }

  /**
   * Start a quest
   */
  async startQuest(questId: BigNumberish): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getGameLogicContract();
    const tx = await contract.startQuest(questId);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Complete a quest
   */
  async completeQuest(questId: BigNumberish): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getGameLogicContract();
    const tx = await contract.completeQuest(questId);
    await tx.wait();
    
    const address = await this.sdk.signer.getAddress();
    const quest = await contract.getQuest(questId);
    this.sdk.emit('questCompleted', address, questId, quest.baseRewardAmount);
    
    return tx.hash;
  }

  /**
   * Get all crafting recipes
   */
  async getCraftingRecipes(): Promise<CraftingRecipe[]> {
    const contract = this.getGameLogicContract();
    const recipesCount = await contract.getCraftingRecipesCount();
    const recipes: CraftingRecipe[] = [];
    
    for (let i = 0; i < Number(recipesCount); i++) {
      const recipe = await contract.getCraftingRecipe(i);
      recipes.push(this.transformCraftingRecipe(recipe, i));
    }
    
    return recipes;
  }

  /**
   * Craft an item
   */
  async craftItem(
    recipeId: BigNumberish,
    useDynamicTokenomics: boolean = true
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getGameLogicContract();
    const tx = await contract.craftItem(recipeId, useDynamicTokenomics);
    const receipt = await tx.wait();
    
    const address = await this.sdk.signer.getAddress();
    const recipe = await contract.getCraftingRecipe(recipeId);
    
    // Check if crafting was successful
    if (receipt && receipt.logs) {
      // Parse logs to determine success
      // This is a simplified implementation
      this.sdk.emit('itemCrafted', address, 0n, recipeId, recipe.baseCost);
    }
    
    return tx.hash;
  }

  /**
   * Get upgrade recipes
   */
  async getUpgradeRecipes(): Promise<UpgradeRecipe[]> {
    const contract = this.getGameLogicContract();
    const recipesCount = await contract.getUpgradeRecipesCount();
    const recipes: UpgradeRecipe[] = [];
    
    for (let i = 0; i < Number(recipesCount); i++) {
      const recipe = await contract.getUpgradeRecipe(i);
      recipes.push(this.transformUpgradeRecipe(recipe, i));
    }
    
    return recipes;
  }

  /**
   * Upgrade an asset
   */
  async upgradeAsset(
    tokenId: BigNumberish,
    recipeId: BigNumberish
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getGameLogicContract();
    const tx = await contract.upgradeAsset(tokenId, recipeId);
    await tx.wait();
    
    const address = await this.sdk.signer.getAddress();
    const recipe = await contract.getUpgradeRecipe(recipeId);
    
    this.sdk.emit('itemUpgraded', address, tokenId, recipe.fromRarity, recipe.toRarity);
    
    return tx.hash;
  }

  /**
   * Start a PvP battle
   */
  async startBattle(player2: string): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    if (!isValidAddress(player2)) {
      throw new Error('Invalid player2 address');
    }
    
    const contract = this.getGameLogicContract();
    const tx = await contract.startBattle(player2);
    await tx.wait();
    
    const address = await this.sdk.signer.getAddress();
    const battleId = `battle_${Date.now()}`; // In production, get from contract
    
    this.sdk.emit('battleStarted', battleId, address, player2);
    
    return tx.hash;
  }

  /**
   * Resolve a battle
   */
  async resolveBattle(
    battleId: string,
    player1Damage: BigNumberish,
    player2Damage: BigNumberish
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getGameLogicContract();
    const tx = await contract.resolveBattle(battleId, player1Damage, player2Damage);
    const receipt = await tx.wait();
    
    // In production, parse logs to get winner and rating change
    this.sdk.emit('battleResolved', battleId, '0x', '0x'); // Placeholder
    
    return tx.hash;
  }

  /**
   * Get player's active battles
   */
  async getPlayerBattles(address?: string): Promise<Battle[]> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const contract = this.getGameLogicContract();
    // This is a simplified implementation
    return [];
  }

  /**
   * Claim daily reward
   */
  async claimDailyReward(): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getGameLogicContract();
    const tx = await contract.claimDailyReward();
    await tx.wait();
    
    return tx.hash;
  }

  private transformQuest(data: any, questId: number): Quest {
    return {
      questId: BigInt(questId),
      name: data.name,
      description: data.description,
      baseRewardAmount: data.baseRewardAmount,
      requiredLevel: Number(data.requiredLevel),
      objectives: data.objectives.map((o: any) => BigInt(o)),
      isActive: data.isActive,
      isDaily: data.isDaily
    };
  }

  private transformCraftingRecipe(data: any, recipeId: number): CraftingRecipe {
    return {
      recipeId: BigInt(recipeId),
      name: data.name,
      assetType: Number(data.assetType),
      requiredLevel: Number(data.requiredLevel),
      baseCost: data.baseCost,
      resourceIds: data.resourceIds.map((r: any) => BigInt(r)),
      resourceAmounts: data.resourceAmounts.map((a: any) => BigInt(a)),
      successRate: Number(data.successRate),
      isActive: data.isActive
    };
  }

  private transformUpgradeRecipe(data: any, recipeId: number): UpgradeRecipe {
    return {
      recipeId: BigInt(recipeId),
      targetAssetType: Number(data.targetAssetType),
      fromRarity: Number(data.fromRarity),
      toRarity: Number(data.toRarity),
      requiredLevel: Number(data.requiredLevel),
      resourceIds: data.resourceIds.map((r: any) => BigInt(r)),
      resourceAmounts: data.resourceAmounts.map((a: any) => BigInt(a)),
      cost: data.cost,
      isActive: data.isActive
    };
  }
}

// ===== MARKETPLACE MODULE =====

export class MarketplaceModule {
  private sdk: LithosProtocolSDK;
  
  constructor(sdk: LithosProtocolSDK) {
    this.sdk = sdk;
  }

  /**
   * Get marketplace contract (use V2 if available)
   */
  getMarketplaceContract(): Contract {
    try {
      return this.sdk.getContract('marketplaceV2');
    } catch {
      return this.sdk.getContract('marketplace');
    }
  }

  /**
   * Create a listing
   */
  async createListing(
    nftContract: string,
    tokenId: BigNumberish,
    amount: BigNumberish,
    listingType: number, // 0 = FIXED_PRICE, 1 = AUCTION, 2 = DUTCH_AUCTION
    paymentToken: string,
    price: BigNumberish,
    duration: BigNumberish = 86400, // 1 day default
    endPrice?: BigNumberish // For Dutch auctions
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    if (!isValidAddress(nftContract) || !isValidAddress(paymentToken)) {
      throw new Error('Invalid contract addresses');
    }
    
    const contract = this.getMarketplaceContract();
    
    if (listingType === 2 && endPrice) {
      // Dutch auction
      const tx = await contract.createDutchAuction(
        nftContract,
        tokenId,
        amount,
        paymentToken,
        price,
        endPrice,
        duration
      );
      await tx.wait();
      return tx.hash;
    } else if (listingType === 1) {
      // Auction
      const tx = await contract.createAuction(
        nftContract,
        tokenId,
        amount,
        paymentToken,
        price,
        duration
      );
      await tx.wait();
      return tx.hash;
    } else {
      // Fixed price
      const tx = await contract.createListing(
        nftContract,
        tokenId,
        amount,
        paymentToken,
        price,
        duration
      );
      await tx.wait();
      return tx.hash;
    }
  }

  /**
   * Create a bulk listing
   */
  async createBulkListing(
    nftContract: string,
    tokenIds: BigNumberish[],
    amounts: BigNumberish[],
    listingType: number,
    paymentToken: string,
    pricePerItem: BigNumberish,
    duration: BigNumberish = 86400
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getMarketplaceContract();
    const tx = await contract.createBulkListing(
      nftContract,
      tokenIds,
      amounts,
      listingType,
      paymentToken,
      pricePerItem,
      duration
    );
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Buy an item
   */
  async buyItem(listingId: BigNumberish): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getMarketplaceContract();
    const tx = await contract.buyItem(listingId);
    const receipt = await tx.wait();
    
    // In production, parse logs to get details
    this.sdk.emit('itemSold', listingId, '', await this.sdk.signer.getAddress(), 0n);
    
    return tx.hash;
  }

  /**
   * Place a bid
   */
  async placeBid(listingId: BigNumberish, amount: BigNumberish): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getMarketplaceContract();
    const tx = await contract.placeBid(listingId, { value: amount });
    await tx.wait();
    
    const address = await this.sdk.signer.getAddress();
    this.sdk.emit('bidPlaced', listingId, address, amount);
    
    return tx.hash;
  }

  /**
   * End an auction
   */
  async endAuction(listingId: BigNumberish): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getMarketplaceContract();
    const tx = await contract.endAuction(listingId);
    await tx.wait();
    
    this.sdk.emit('auctionEnded', listingId, '', 0n);
    
    return tx.hash;
  }

  /**
   * Cancel a listing
   */
  async cancelListing(listingId: BigNumberish): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getMarketplaceContract();
    const tx = await contract.cancelListing(listingId);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Get a listing
   */
  async getListing(listingId: BigNumberish): Promise<Listing> {
    const contract = this.getMarketplaceContract();
    const listing = await contract.getListing(listingId);
    
    return this.transformListing(listing, listingId);
  }

  /**
   * Get Dutch auction info
   */
  async getDutchAuctionInfo(listingId: BigNumberish): Promise<DutchAuctionInfo> {
    const contract = this.getMarketplaceContract();
    const info = await contract.getDutchAuctionInfo(listingId);
    
    return {
      startingPrice: info.startingPrice,
      endingPrice: info.endingPrice,
      startTime: info.startTime,
      endTime: info.endTime,
      isActive: info.isActive,
      currentPrice: info.currentPrice
    };
  }

  /**
   * Search listings
   */
  async searchListings(filters: SearchFilters = {}, page: number = 1, pageSize: number = 20): Promise<SearchResult> {
    const contract = this.getMarketplaceContract();
    
    // This is a simplified implementation
    // In production, use the contract's search functionality
    const allListings = await contract.getAllListings();
    
    let filteredListings = allListings.map((l: any, i: number) => this.transformListing(l, i));
    
    // Apply filters
    if (filters.categoryId) {
      filteredListings = filteredListings.filter(l => 
        l.metadata?.categoryId === filters.categoryId
      );
    }
    
    if (filters.minRarity !== undefined) {
      filteredListings = filteredListings.filter(l => 
        l.metadata?.rarity >= filters.minRarity
      );
    }
    
    if (filters.maxRarity !== undefined) {
      filteredListings = filteredListings.filter(l => 
        l.metadata?.rarity <= filters.maxRarity
      );
    }
    
    if (filters.minPrice) {
      filteredListings = filteredListings.filter(l => 
        l.price >= filters.minPrice!
      );
    }
    
    if (filters.maxPrice) {
      filteredListings = filteredListings.filter(l => 
        l.price <= filters.maxPrice!
      );
    }
    
    if (filters.seller) {
      filteredListings = filteredListings.filter(l => 
        l.seller.toLowerCase() === filters.seller!.toLowerCase()
      );
    }
    
    // Pagination
    const start = (page - 1) * pageSize;
    const paginatedListings = filteredListings.slice(start, start + pageSize);
    
    return {
      listings: paginatedListings,
      total: filteredListings.length,
      page,
      pageSize
    };
  }

  /**
   * Get listings by seller
   */
  async getListingsBySeller(seller: string): Promise<Listing[]> {
    const contract = this.getMarketplaceContract();
    const listings = await contract.getListingsBySeller(seller);
    
    return listings.map((l: any, i: number) => this.transformListing(l, i));
  }

  private transformListing(data: any, listingId: number): Listing {
    return {
      listingId: BigInt(listingId),
      seller: data.seller,
      nftContract: data.nftContract,
      tokenId: data.tokenId,
      amount: data.amount,
      assetType: data.assetType === 0 ? 'ERC721' : 'ERC1155',
      listingType: this.numberToListingType(data.listingType),
      paymentToken: data.paymentToken,
      price: data.price,
      endPrice: data.endPrice,
      endTime: data.endTime,
      isActive: data.isActive,
      highestBidder: data.highestBidder,
      highestBid: data.highestBid,
      metadata: {
        name: data.metadata?.name || '',
        description: data.metadata?.description || '',
        categoryId: data.metadata?.categoryId || 0n,
        rarity: data.metadata?.rarity || 1,
        level: data.metadata?.level || 1,
        isVerified: data.metadata?.isVerified || false
      }
    };
  }

  private numberToListingType(num: number): ListingType {
    const types: ListingType[] = ['FIXED_PRICE', 'AUCTION', 'DUTCH_AUCTION'];
    return types[num] || 'FIXED_PRICE';
  }
}

// ===== STAKING MODULE =====

export class StakingModule {
  private sdk: LithosProtocolSDK;
  
  constructor(sdk: LithosProtocolSDK) {
    this.sdk = sdk;
  }

  /**
   * Get staking contract
   */
  getStakingContract(): Contract {
    return this.sdk.getContract('stakingContract');
  }

  /**
   * Get all staking pools
   */
  async getStakingPools(): Promise<StakingPool[]> {
    const contract = this.getStakingContract();
    const poolsCount = await contract.getPoolsCount();
    const pools: StakingPool[] = [];
    
    for (let i = 0; i < Number(poolsCount); i++) {
      const pool = await contract.getPool(i);
      pools.push(this.transformStakingPool(pool, i));
    }
    
    return pools;
  }

  /**
   * Get a specific staking pool
   */
  async getStakingPool(poolId: BigNumberish): Promise<StakingPool> {
    const contract = this.getStakingContract();
    const pool = await contract.getPool(poolId);
    return this.transformStakingPool(pool, Number(poolId));
  }

  /**
   * Stake tokens
   */
  async stakeTokens(
    poolId: BigNumberish,
    amount: BigNumberish
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getStakingContract();
    const tx = await contract.stake(poolId, amount);
    await tx.wait();
    
    const address = await this.sdk.signer.getAddress();
    this.sdk.emit('tokensStaked', address, poolId, amount);
    
    return tx.hash;
  }

  /**
   * Stake NFT
   */
  async stakeNFT(
    poolId: BigNumberish,
    tokenId: BigNumberish
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getStakingContract();
    const tx = await contract.stakeNFT(poolId, tokenId);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Unstake tokens
   */
  async unstakeTokens(
    poolId: BigNumberish,
    amount: BigNumberish
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getStakingContract();
    const tx = await contract.unstake(poolId, amount);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Unstake NFT
   */
  async unstakeNFT(
    poolId: BigNumberish,
    tokenId: BigNumberish
  ): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getStakingContract();
    const tx = await contract.unstakeNFT(poolId, tokenId);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Claim rewards
   */
  async claimRewards(poolId: BigNumberish): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getStakingContract();
    const tx = await contract.claimRewards(poolId);
    await tx.wait();
    
    const address = await this.sdk.signer.getAddress();
    const rewards = await contract.getUserRewards(poolId, address);
    this.sdk.emit('rewardsClaimed', address, poolId, rewards);
    
    return tx.hash;
  }

  /**
   * Get user stake info
   */
  async getUserStake(poolId: BigNumberish, address?: string): Promise<UserStake> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const contract = this.getStakingContract();
    const stake = await contract.getUserStake(poolId, targetAddress);
    
    return {
      amount: stake.amount,
      stakedAt: stake.stakedAt,
      lockUntil: stake.lockUntil,
      rewards: stake.rewards,
      stakedTokenIds: stake.stakedTokenIds.map((t: any) => BigInt(t))
    };
  }

  /**
   * Get user rewards
   */
  async getUserRewards(poolId: BigNumberish, address?: string): Promise<bigint> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const contract = this.getStakingContract();
    return await contract.getUserRewards(poolId, targetAddress);
  }

  private transformStakingPool(data: any, poolId: number): StakingPool {
    return {
      poolId: BigInt(poolId),
      poolType: data.poolType === 0 ? 'TOKEN_STAKING' : 'NFT_STAKING',
      stakingToken: data.stakingToken,
      rewardRate: data.rewardRate,
      lockPeriod: data.lockPeriod,
      totalStaked: data.totalStaked,
      isActive: data.isActive,
      maxStakePerUser: data.maxStakePerUser
    };
  }
}

// ===== VESTING MODULE =====

export class VestingModule {
  private sdk: LithosProtocolSDK;
  
  constructor(sdk: LithosProtocolSDK) {
    this.sdk = sdk;
  }

  /**
   * Get vesting contract
   */
  getVestingContract(): Contract {
    return this.sdk.getContract('vesting');
  }

  /**
   * Get vesting schedules for an address
   */
  async getVestingSchedules(address?: string): Promise<VestingSchedule[]> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const contract = this.getVestingContract();
    const schedulesCount = await contract.getSchedulesCount(targetAddress);
    const schedules: VestingSchedule[] = [];
    
    for (let i = 0; i < Number(schedulesCount); i++) {
      const schedule = await contract.getSchedule(targetAddress, i);
      schedules.push(this.transformVestingSchedule(schedule, i));
    }
    
    return schedules;
  }

  /**
   * Get a specific vesting schedule
   */
  async getVestingSchedule(
    beneficiary: string,
    scheduleId: BigNumberish
  ): Promise<VestingSchedule> {
    const contract = this.getVestingContract();
    const schedule = await contract.getSchedule(beneficiary, scheduleId);
    return this.transformVestingSchedule(schedule, Number(scheduleId));
  }

  /**
   * Claim vested tokens
   */
  async claimVestedTokens(scheduleId: BigNumberish): Promise<string> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const contract = this.getVestingContract();
    const address = await this.sdk.signer.getAddress();
    const tx = await contract.claim(address, scheduleId);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Claim all vested tokens
   */
  async claimAllVestedTokens(): Promise<string[]> {
    if (!this.sdk.signer) {
      throw new NotSignedInError();
    }
    
    const address = await this.sdk.signer.getAddress();
    const schedules = await this.getVestingSchedules(address);
    const txHashes: string[] = [];
    
    for (const schedule of schedules) {
      if (schedule.vestedAmount < schedule.totalAmount) {
        const txHash = await this.claimVestedTokens(schedule.scheduleId);
        txHashes.push(txHash);
      }
    }
    
    return txHashes;
  }

  /**
   * Get total vested amount for an address
   */
  async getTotalVested(address?: string): Promise<bigint> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const contract = this.getVestingContract();
    return await contract.getTotalVested(targetAddress);
  }

  /**
   * Get claimable amount for an address
   */
  async getClaimableAmount(address?: string): Promise<bigint> {
    const targetAddress = address || (this.sdk.signer ? await this.sdk.signer.getAddress() : undefined);
    if (!targetAddress) {
      throw new NotSignedInError();
    }
    
    const contract = this.getVestingContract();
    return await contract.getClaimableAmount(targetAddress);
  }

  private transformVestingSchedule(data: any, scheduleId: number): VestingSchedule {
    return {
      scheduleId: BigInt(scheduleId),
      beneficiary: data.beneficiary,
      totalAmount: data.totalAmount,
      vestedAmount: data.vestedAmount,
      startTime: data.startTime,
      cliffDuration: data.cliffDuration,
      vestingDuration: data.vestingDuration,
      isActive: data.isActive,
      allocationName: data.allocationName,
      allocationType: data.allocationType
    };
  }
}

// ========== EXPORTS ==========

export { LithosProtocolSDK as default };
