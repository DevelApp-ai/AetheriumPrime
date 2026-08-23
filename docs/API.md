# LithosProtocol API Documentation

## Table of Contents

1. [Web3 SDK API](#web3-sdk-api)
2. [Unity SDK API](#unity-sdk-api)
3. [Smart Contract API](#smart-contract-api)
4. [REST API (Backend)](#rest-api-backend)

---

## Web3 SDK API

### Installation

```bash
npm install @lithosprotocol/web3-sdk
```

### Initialization

```typescript
import { LithosProtocolSDK } from '@lithosprotocol/web3-sdk';

// Initialize with default configuration
const sdk = new LithosProtocolSDK({
  network: 'sepolia',
  debug: false
});

// Initialize with custom configuration
await sdk.initialize({
  network: 'sepolia',
  contracts: {
    governanceToken: '0x123...',
    utilityToken: '0x456...',
    // ... other contract addresses
  },
  provider: window.ethereum, // MetaMask provider
  debug: true
});

// Connect wallet
await sdk.connectWallet(window.ethereum);
```

### Player Module

```typescript
// Register a new player
const txHash = await sdk.player.registerPlayer('0xReferrerAddress');

// Get player data
const playerData = await sdk.player.getPlayerData();
// Returns: PlayerData object with level, experience, PvP stats, etc.

// Get player stats
const playerStats = await sdk.player.getPlayerStats();
// Returns: PlayerStats with quests completed, crafting stats, streaks

// Check if player is registered
const isRegistered = await sdk.player.isPlayerRegistered();

// Get player balance (tokens and NFTs)
const balance = await sdk.player.getPlayerBalance();
// Returns: { tokens: TokenBalance, assets: NFTAsset[], resources: NFTResource[] }

// Claim daily reward
const txHash = await sdk.player.claimDailyReward();

// Get daily reward amount
const amount = await sdk.player.getDailyRewardAmount();

// Get last daily reward claim time
const timestamp = await sdk.player.getLastDailyRewardClaimTime();
```

### Token Module

```typescript
// Get token info
const tokenInfo = await sdk.token.getTokenInfo('governance');
// Returns: { name, symbol, decimals, totalSupply, address }

// Get token balance
const balance = await sdk.token.getBalance('governance');
// Returns: BigNumber (wei)

// Get both token balances
const balances = await sdk.token.getTokenBalances();
// Returns: { governanceToken: BigNumber, utilityToken: BigNumber }

// Transfer tokens
const txHash = await sdk.token.transfer(
  'governance',
  '0xRecipientAddress',
  ethers.parseEther('100')
);

// Approve token spending
const txHash = await sdk.token.approve(
  'governance',
  '0xSpenderAddress',
  ethers.MaxUint256
);

// Get allowance
const allowance = await sdk.token.getAllowance(
  'governance',
  '0xOwnerAddress',
  '0xSpenderAddress'
);

// Check if approval is needed
const needsApproval = await sdk.token.needsApproval(
  'governance',
  '0xSpenderAddress',
  ethers.parseEther('100')
);

// Burn tokens
const txHash = await sdk.token.burn(
  'governance',
  ethers.parseEther('100')
);

// Format amount for display
const formatted = await sdk.token.formatAmount(
  ethers.parseEther('100'),
  'governance'
);

// Parse formatted amount to wei
const weiAmount = await sdk.token.parseAmount(
  '100',
  'governance'
);
```

### NFT Module

```typescript
// Get game asset NFT contract
const contract = sdk.nft.getGameAssetNFTContract();

// Get game resource NFT contract
const resourceContract = sdk.nft.getGameResourceNFTContract();

// Mint a new game asset
const txHash = await sdk.nft.mintAsset(
  0, // assetType (0=Character, 1=Land, 2=Weapon, 3=Armor, 4=Accessory)
  'ipfs://metadata-uri',
  1, // level
  3 // rarity (1-5)
);

// Mint game resources
const txHash = await sdk.nft.mintResources(
  [0, 1, 2], // resourceIds
  [10, 5, 2] // amounts
);

// Get player's assets
const assets = await sdk.nft.getPlayerAssets();
// Returns: NFTAsset[] with tokenId, assetType, name, description, level, rarity, etc.

// Get player's resources
const resources = await sdk.nft.getPlayerResources();
// Returns: NFTResource[] with resourceId, resourceType, name, maxSupply, balance, rarity

// Get asset details
const asset = await sdk.nft.getAsset(1); // tokenId

// Transfer asset
const txHash = await sdk.nft.transferAsset(
  '0xRecipientAddress',
  1 // tokenId
);

// Approve asset spending
const txHash = await sdk.nft.approveAsset(
  '0xSpenderAddress',
  1 // tokenId
);
```

### Game Module

```typescript
// Get quests
const quests = await sdk.game.getQuests();
// Returns: Quest[] with questId, name, description, reward, requirements, objectives

// Get player's active quests
const playerQuests = await sdk.game.getPlayerQuests();

// Start a quest
const txHash = await sdk.game.startQuest(0); // questId

// Complete a quest
const txHash = await sdk.game.completeQuest(0); // questId

// Get crafting recipes
const recipes = await sdk.game.getCraftingRecipes();
// Returns: CraftingRecipe[] with recipeId, name, assetType, requirements, costs, successRate

// Craft an item
const txHash = await sdk.game.craftItem(
  0, // recipeId
  true // useDynamicTokenomics
);

// Get upgrade recipes
const upgradeRecipes = await sdk.game.getUpgradeRecipes();
// Returns: UpgradeRecipe[] with recipeId, targetAssetType, fromRarity, toRarity, requirements

// Upgrade an asset
const txHash = await sdk.game.upgradeAsset(
  1, // tokenId
  0 // recipeId
);

// Start a PvP battle
const txHash = await sdk.game.startBattle('0xOpponentAddress');

// Resolve a battle
const txHash = await sdk.game.resolveBattle(
  'battleId',
  100, // player1Damage
  50  // player2Damage
);

// Get player's active battles
const battles = await sdk.game.getPlayerBattles();

// Claim daily reward (also available in Player module)
const txHash = await sdk.game.claimDailyReward();
```

### Marketplace Module

```typescript
// Get marketplace contract
const contract = sdk.marketplace.getMarketplaceContract();

// Create a listing (Fixed Price)
const txHash = await sdk.marketplace.createListing(
  '0xNFTContractAddress',
  1, // tokenId
  1, // amount
  0, // listingType (0=FIXED_PRICE, 1=AUCTION, 2=DUTCH_AUCTION)
  '0xPaymentTokenAddress',
  ethers.parseEther('0.1'), // price
  86400 // duration (1 day in seconds)
);

// Create a Dutch auction
const txHash = await sdk.marketplace.createDutchAuction(
  '0xNFTContractAddress',
  1, // tokenId
  1, // amount
  '0xPaymentTokenAddress',
  ethers.parseEther('1'), // startingPrice
  ethers.parseEther('0.1'), // endingPrice
  86400 // duration
);

// Create a bulk listing
const txHash = await sdk.marketplace.createBulkListing(
  '0xNFTContractAddress',
  [1, 2, 3], // tokenIds
  [1, 1, 1], // amounts
  0, // listingType
  '0xPaymentTokenAddress',
  ethers.parseEther('0.1'), // pricePerItem
  86400 // duration
);

// Buy an item
const txHash = await sdk.marketplace.buyItem(0); // listingId

// Place a bid
const txHash = await sdk.marketplace.placeBid(
  0, // listingId
  ethers.parseEther('0.15') // amount
);

// End an auction
const txHash = await sdk.marketplace.endAuction(0); // listingId

// Cancel a listing
const txHash = await sdk.marketplace.cancelListing(0); // listingId

// Get a listing
const listing = await sdk.marketplace.getListing(0);
// Returns: Listing with all details

// Get Dutch auction info
const auctionInfo = await sdk.marketplace.getDutchAuctionInfo(0);
// Returns: DutchAuctionInfo with current price, etc.

// Search listings
const result = await sdk.marketplace.searchListings({
  categoryId: 1,
  minRarity: 3,
  maxRarity: 5,
  minPrice: ethers.parseEther('0.1'),
  maxPrice: ethers.parseEther('1'),
  seller: '0xSellerAddress',
  listingType: 0 // FIXED_PRICE
}, 1, 20); // page, pageSize

// Get listings by seller
const listings = await sdk.marketplace.getListingsBySeller('0xSellerAddress');
```

### Staking Module

```typescript
// Get staking contract
const contract = sdk.staking.getStakingContract();

// Get all staking pools
const pools = await sdk.staking.getStakingPools();
// Returns: StakingPool[] with poolId, poolType, stakingToken, rewardRate, lockPeriod, etc.

// Get a specific staking pool
const pool = await sdk.staking.getStakingPool(0);

// Stake tokens
const txHash = await sdk.staking.stakeTokens(
  0, // poolId
  ethers.parseEther('100') // amount
);

// Stake NFT
const txHash = await sdk.staking.stakeNFT(
  0, // poolId
  1 // tokenId
);

// Unstake tokens
const txHash = await sdk.staking.unstakeTokens(
  0, // poolId
  ethers.parseEther('50') // amount
);

// Unstake NFT
const txHash = await sdk.staking.unstakeNFT(
  0, // poolId
  1 // tokenId
);

// Claim rewards
const txHash = await sdk.staking.claimRewards(0); // poolId

// Get user stake info
const stakeInfo = await sdk.staking.getUserStake(0); // poolId
// Returns: UserStake with amount, stakedAt, lockUntil, rewards, stakedTokenIds

// Get user rewards
const rewards = await sdk.staking.getUserRewards(0); // poolId
```

### Vesting Module

```typescript
// Get vesting contract
const contract = sdk.vesting.getVestingContract();

// Get vesting schedules for address
const schedules = await sdk.vesting.getVestingSchedules();
// Returns: VestingSchedule[] with scheduleId, beneficiary, totalAmount, vestedAmount, etc.

// Get a specific vesting schedule
const schedule = await sdk.vesting.getVestingSchedule(
  '0xBeneficiaryAddress',
  0 // scheduleId
);

// Claim vested tokens
const txHash = await sdk.vesting.claimVestedTokens(0); // scheduleId

// Claim all vested tokens
const txHashes = await sdk.vesting.claimAllVestedTokens();

// Get total vested amount
const totalVested = await sdk.vesting.getTotalVested();

// Get claimable amount
const claimable = await sdk.vesting.getClaimableAmount();
```

### Event System

```typescript
// Subscribe to events
sdk.on('playerRegistered', (player: string) => {
  console.log('Player registered:', player);
});

sdk.on('questCompleted', (player: string, questId: bigint, reward: bigint) => {
  console.log('Quest completed:', { player, questId, reward });
});

sdk.on('pvpResult', (winner: string, loser: string, reward: bigint, ratingChange: bigint) => {
  console.log('PvP result:', { winner, loser, reward, ratingChange });
});

sdk.on('battleStarted', (battleId: string, player1: string, player2: string) => {
  console.log('Battle started:', { battleId, player1, player2 });
});

sdk.on('battleResolved', (battleId: string, winner: string, loser: string) => {
  console.log('Battle resolved:', { battleId, winner, loser });
});

sdk.on('itemCrafted', (player: string, tokenId: bigint, recipeId: bigint, cost: bigint) => {
  console.log('Item crafted:', { player, tokenId, recipeId, cost });
});

sdk.on('itemUpgraded', (player: string, tokenId: bigint, fromRarity: number, toRarity: number) => {
  console.log('Item upgraded:', { player, tokenId, fromRarity, toRarity });
});

sdk.on('itemListed', (listingId: bigint, seller: string, nftContract: string, tokenId: bigint) => {
  console.log('Item listed:', { listingId, seller, nftContract, tokenId });
});

sdk.on('itemSold', (listingId: bigint, seller: string, buyer: string, price: bigint) => {
  console.log('Item sold:', { listingId, seller, buyer, price });
});

sdk.on('bidPlaced', (listingId: bigint, bidder: string, amount: bigint) => {
  console.log('Bid placed:', { listingId, bidder, amount });
});

sdk.on('auctionEnded', (listingId: bigint, winner: string, winningBid: bigint) => {
  console.log('Auction ended:', { listingId, winner, winningBid });
});

sdk.on('tokensStaked', (user: string, poolId: bigint, amount: bigint) => {
  console.log('Tokens staked:', { user, poolId, amount });
});

sdk.on('rewardsClaimed', (user: string, poolId: bigint, amount: bigint) => {
  console.log('Rewards claimed:', { user, poolId, amount });
});

// Unsubscribe from events
sdk.off('playerRegistered', listener);

// Emit events (internal use)
sdk.emit('playerRegistered', playerAddress);
```

### Utility Methods

```typescript
// Execute transaction with retry
const receipt = await sdk.executeTx(
  contract.methods.someMethod(param1, param2),
  {
    gasLimit: 5000000,
    maxRetries: 3,
    onSuccess: (txHash) => console.log('Success:', txHash),
    onError: (error) => console.error('Error:', error)
  }
);

// Estimate gas
const gasEstimate = await sdk.estimateGas(
  'transfer',
  ['0xRecipientAddress', ethers.parseEther('100')],
  'governanceToken'
);

// Get transaction receipt
const receipt = await sdk.getTransactionReceipt('0xTxHash');

// Wait for confirmation
const receipt = await sdk.waitForConfirmation('0xTxHash', 1);

// Get current network
const network = sdk.getCurrentNetwork();

// Get connected address
const address = await sdk.getAddress();

// Check connection status
const isConnected = sdk.isConnected;
const isSignedIn = sdk.isSignedIn;

// Disconnect wallet
sdk.disconnectWallet();
```

---

## Unity SDK API

### Installation

1. Copy the `unity` folder to your Unity project's `Assets` directory
2. Import the scripts in Unity

### Basic Usage

```csharp
using LithosProtocol.Unity;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    private LithosProtocolUnity lithos;
    
    async void Start()
    {
        lithos = new LithosProtocolUnity();
        
        // Initialize with default configuration
        await lithos.Initialize();
        
        // Or with custom configuration
        var config = new LithosConfig
        {
            Network = Network.Sepolia,
            RpcUrl = "https://sepolia.infura.io/v3/YOUR_KEY",
            ContractAddresses = new ContractAddresses
            {
                GovernanceToken = "0x123...",
                UtilityToken = "0x456...",
                // ... other addresses
            },
            Debug = true
        };
        
        await lithos.Initialize(config);
        
        // Connect wallet
        await lithos.ConnectWallet();
    }
}
```

### Player Module (Unity)

```csharp
// Register player
string txHash = await lithos.Player.RegisterPlayer("0xReferrer");

// Get player data
var playerData = await lithos.Player.GetPlayerData();

// Check if registered
bool isRegistered = await lithos.Player.IsPlayerRegistered();

// Claim daily reward
string txHash = await lithos.Player.ClaimDailyReward();
```

### Token Module (Unity)

```csharp
// Get token info
var tokenInfo = await lithos.Token.GetTokenInfo(TokenType.Governance);

// Get balance
var balance = await lithos.Token.GetBalance(TokenType.Governance);

// Get both balances
var balances = await lithos.Token.GetTokenBalances();

// Transfer tokens
string txHash = await lithos.Token.Transfer(
    TokenType.Governance,
    "0xRecipient",
    BigInteger.Parse("1000000000000000000") // 1 token in wei
);

// Approve spending
string txHash = await lithos.Token.Approve(
    TokenType.Governance,
    "0xSpender",
    BigInteger.Parse("1000000000000000000000") // 1000 tokens
);
```

### NFT Module (Unity)

```csharp
// Get player assets
var assets = await lithos.NFT.GetPlayerAssets();

// Get player resources
var resources = await lithos.NFT.GetPlayerResources();

// Transfer asset
string txHash = await lithos.NFT.TransferAsset("0xRecipient", 1);
```

### Game Module (Unity)

```csharp
// Get quests
var quests = await lithos.Game.GetQuests();

// Start quest
string txHash = await lithos.Game.StartQuest(0);

// Complete quest
string txHash = await lithos.Game.CompleteQuest(0);

// Craft item
string txHash = await lithos.Game.CraftItem(0, true);
```

### Error Handling (Unity)

```csharp
try
{
    string txHash = await lithos.Token.Transfer(
        TokenType.Governance,
        "0xInvalidAddress",
        BigInteger.One
    );
}
catch (LithosException ex)
{
    Debug.LogError($"Lithos Error: {ex.Message}");
    
    switch (ex)
    {
        case NotConnectedException:
            Debug.Log("Not connected to provider");
            break;
        case NotSignedInException:
            Debug.Log("Not signed in to wallet");
            break;
        case InsufficientBalanceException insufficient:
            Debug.Log($"Insufficient {insufficient.Token}: need {insufficient.Required}, have {insufficient.Available}");
            break;
        case ApprovalRequiredException approval:
            Debug.Log($"Approval required for {approval.Contract}");
            break;
        default:
            Debug.LogError($"Unknown error: {ex.Message}");
            break;
    }
}
```

---

## Smart Contract API

### GovernanceToken

**Functions:**
```solidity
// View
function name() external view returns (string)
function symbol() external view returns (string)
function decimals() external view returns (uint8)
function totalSupply() external view returns (uint256)
function balanceOf(address) external view returns (uint256)
function allowance(address, address) external view returns (uint256)
function getVotes(address) external view returns (uint256)
function paused() external view returns (bool)

// State-changing
function transfer(address, uint256) external returns (bool)
function transferFrom(address, address, uint256) external returns (bool)
function approve(address, uint256) external returns (bool)
function mint(address, uint256) external
function burn(uint256) external
function delegate(address) external
function pause() external
function unpause() external
```

**Events:**
```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
event Approval(address indexed owner, address indexed spender, uint256 value)
event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)
event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance)
event Paused(address account)
event Unpaused(address account)
```

### UtilityToken

Same interface as GovernanceToken (ERC20 + Burnable + Pausable + UUPS)

### GameAssetNFT

**Functions:**
```solidity
// View
function name() external view returns (string)
function symbol() external view returns (string)
function balanceOf(address) external view returns (uint256)
function ownerOf(uint256) external view returns (address)
function tokenURI(uint256) external view returns (string)
function getAsset(uint256) external view returns (Asset memory)
function tokenOfOwnerByIndex(address, uint256) external view returns (uint256)
function totalSupply() external view returns (uint256)
function paused() external view returns (bool)

// State-changing
function mint(uint256, string, uint256, uint256) external returns (uint256)
function safeMint(address, uint256) external
function transferFrom(address, address, uint256) external
function safeTransferFrom(address, address, uint256) external
function approve(address, uint256) external
function setApprovalForAll(address, bool) external
function pause() external
function unpause() external
```

**Events:**
```solidity
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)
event ApprovalForAll(address indexed owner, address indexed operator, bool approved)
event Paused(address account)
event Unpaused(address account)
```

### GameResourceNFT

**Functions:**
```solidity
// View
function name() external view returns (string)
function symbol() external view returns (string)
function balanceOf(address, uint256) external view returns (uint256)
function balanceOfBatch(address[], uint256[]) external view returns (uint256[])
function uri(uint256) external view returns (string)
function getResource(uint256) external view returns (Resource memory)
function totalSupply(uint256) external view returns (uint256)
function paused() external view returns (bool)

// State-changing
function createResourceType(uint256, string, uint256, uint256) external
function mintBatch(address, uint256[], uint256[], bytes) external
function setResourceMaxSupply(uint256, uint256) external
function activateResource(uint256) external
function safeTransferFrom(address, address, uint256, uint256, bytes) external
function safeBatchTransferFrom(address, address, uint256[], uint256[], bytes) external
function setApprovalForAll(address, bool) external
function pause() external
function unpause() external
```

### GameLogic

**Functions:**
```solidity
// View
function getPlayerData(address) external view returns (PlayerData memory)
function getQuest(uint256) external view returns (Quest memory)
function getQuestsCount() external view returns (uint256)
function getPlayerActiveQuests(address) external view returns (uint256[] memory)
function isPlayerRegistered(address) external view returns (bool)
function getDailyRewardAmount() external view returns (uint256)
function getLastDailyRewardClaimTime() external view returns (uint256)
function getCraftingRecipe(uint256) external view returns (CraftingRecipe memory)
function getCraftingRecipesCount() external view returns (uint256)
function getUpgradeRecipe(uint256) external view returns (UpgradeRecipe memory)
function getUpgradeRecipesCount() external view returns (uint256)
function paused() external view returns (bool)

// State-changing
function registerPlayer(address) external
function startQuest(uint256) external
function completeQuest(uint256) external
function craftItem(uint256, bool) external
function upgradeAsset(uint256, uint256) external
function claimDailyReward() external
function addQuest(uint256, string, string, uint256, uint256, uint256[], bool, bool) external
function addCraftingRecipe(uint256, uint256, uint256, uint256, uint256[], uint256[], uint256, bool) external
function addUpgradeRecipe(uint256, uint256, uint256, uint256, uint256[], uint256[], uint256, bool) external
function pause() external
function unpause() external
```

**Events:**
```solidity
event PlayerRegistered(address indexed player)
event QuestStarted(address indexed player, uint256 questId)
event QuestCompleted(address indexed player, uint256 questId)
event ItemCrafted(address indexed player, uint256 tokenId, uint256 recipeId, uint256 cost)
event DailyRewardClaimed(address indexed player, uint256 amount)
event Paused(address account)
event Unpaused(address account)
```

### GameLogicV2 (Enhanced)

Includes all GameLogic functions plus:

**Functions:**
```solidity
// View
function getPlayerBattles(address) external view returns (Battle[] memory)
function getBattle(uint256) external view returns (Battle memory)
function getLevelCap() external view returns (uint256)

// State-changing
function startBattle(address) external
function resolveBattle(uint256, uint256, uint256) external
function setLevelCap(uint256) external
function setDynamicTokenomics(address) external
```

**Events:**
```solidity
event BattleStarted(uint256 indexed battleId, address indexed player1, address indexed player2)
event BattleResolved(uint256 indexed battleId, address indexed winner, address indexed loser, int256 ratingChange)
event ItemUpgraded(address indexed player, uint256 indexed tokenId, uint256 fromRarity, uint256 toRarity)
```

### Marketplace

**Functions:**
```solidity
// View
function getListing(uint256) external view returns (Listing memory)
function getAllListings() external view returns (Listing[] memory)
function getListingsBySeller(address) external view returns (Listing[] memory)
function getListingsCount() external view returns (uint256)
function paused() external view returns (bool)

// State-changing
function createListing(address, uint256, uint256, uint256, address, uint256, uint256) external
function createAuction(address, uint256, uint256, uint256, address, uint256, uint256) external
function buyItem(uint256) external
function placeBid(uint256) external payable
function endAuction(uint256) external
function cancelListing(uint256) external
function pause() external
function unpause() external
```

**Events:**
```solidity
event ItemListed(uint256 indexed listingId, address indexed seller, address nftContract, uint256 tokenId)
event ItemSold(uint256 indexed listingId, address indexed seller, address indexed buyer, uint256 price)
event BidPlaced(uint256 indexed listingId, address indexed bidder, uint256 amount)
event AuctionEnded(uint256 indexed listingId, address indexed winner, uint256 winningBid)
event Paused(address account)
event Unpaused(address account)
```

### MarketplaceV2 (Enhanced)

Includes all Marketplace functions plus:

**Functions:**
```solidity
// View
function getDutchAuctionInfo(uint256) external view returns (DutchAuctionInfo memory)

// State-changing
function createDutchAuction(address, uint256, uint256, uint256, address, uint256, uint256, uint256) external
function createBulkListing(address, uint256[], uint256[], uint256, address, uint256, uint256) external
function setGameLogic(address) external
```

### StakingContract

**Functions:**
```solidity
// View
function getPoolsCount() external view returns (uint256)
function getPool(uint256) external view returns (StakingPool memory)
function getUserStake(uint256, address) external view returns (UserStake memory)
function getUserRewards(uint256, address) external view returns (uint256)
function getTotalStaked(uint256) external view returns (uint256)
function paused() external view returns (bool)

// State-changing
function stake(uint256, uint256) external
function stakeNFT(uint256, uint256) external
function unstake(uint256, uint256) external
function unstakeNFT(uint256, uint256) external
function claimRewards(uint256) external
function addPool(uint256, uint256, uint256, bool) external
function setRewardRate(uint256) external
function pause() external
function unpause() external
```

**Events:**
```solidity
event TokensStaked(address indexed user, uint256 indexed poolId, uint256 amount)
event TokensUnstaked(address indexed user, uint256 indexed poolId, uint256 amount)
event NFTStaked(address indexed user, uint256 indexed poolId, uint256 tokenId)
event NFTUnstaked(address indexed user, uint256 indexed poolId, uint256 tokenId)
event RewardsClaimed(address indexed user, uint256 indexed poolId, uint256 amount)
event PoolAdded(uint256 indexed poolId)
event Paused(address account)
event Unpaused(address account)
```

### Vesting

**Functions:**
```solidity
// View
function getSchedulesCount(address) external view returns (uint256)
function getSchedule(address, uint256) external view returns (VestingSchedule memory)
function getTotalVested(address) external view returns (uint256)
function getClaimableAmount(address) external view returns (uint256)
function paused() external view returns (bool)

// State-changing
function createSchedule(address, uint256, uint256, uint256, uint256, string, uint256) external
function claim(address, uint256) external
function batchClaim(address, uint256[]) external
function pause() external
function unpause() external
```

**Events:**
```solidity
event ScheduleCreated(uint256 indexed scheduleId, address indexed beneficiary, uint256 amount)
event TokensClaimed(uint256 indexed scheduleId, address indexed beneficiary, uint256 amount)
event Paused(address account)
event Unpaused(address account)
```

### MultiSigWallet

**Functions:**
```solidity
// View
function getThreshold() external view returns (uint256)
function getOwners() external view returns (address[] memory)
function isOwner(address) external view returns (bool)
function getTransaction(uint256) external view returns (Transaction memory)
function getTransactionCount() external view returns (uint256)
function isApproved(uint256, address) external view returns (bool)
function getApprovalCount(uint256) external view returns (uint256)
function canExecute(uint256) external view returns (bool)
function getApprovedTransactions(address) external view returns (uint256[] memory)
function getBalance() external view returns (uint256)
function paused() external view returns (bool)

// State-changing
function addOwner(address) external
function removeOwner(address) external
function replaceOwner(address, address) external
function changeThreshold(uint256) external
function submitTransaction(address, uint256, bytes, uint256) external returns (uint256)
function approveTransaction(uint256) external
function revokeApproval(uint256) external
function executeTransaction(uint256) external
function submitAndExecute(address, uint256, bytes, uint256) external
function incrementNonce() external
function pause() external
function unpause() external
```

**Events:**
```solidity
event WalletInitialized(address[] owners, uint256 threshold)
event OwnerAdded(address owner)
event OwnerRemoved(address owner)
event ThresholdChanged(uint256 newThreshold)
event TransactionSubmitted(uint256 transactionId, address submitter)
event TransactionApproved(uint256 transactionId, address approver)
event TransactionRevoked(uint256 transactionId, address revoker)
event TransactionExecuted(uint256 transactionId, address executor)
event ETHTransferred(address to, uint256 amount, uint256 transactionId)
event ERC20Transferred(address token, address to, uint256 amount, uint256 transactionId)
event ERC721Transferred(address token, address to, uint256 tokenId, uint256 transactionId)
event ERC1155Transferred(address token, address to, uint256 tokenId, uint256 amount, uint256 transactionId)
event Paused(address account)
event Unpaused(address account)
```

---

## REST API (Backend)

### Base URL
```
Production: https://api.lithosprotocol.io/v1
Testnet: https://api-testnet.lithosprotocol.io/v1
```

### Authentication
All endpoints require an API key in the header:
```
Authorization: Bearer YOUR_API_KEY
```

### Players

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /players | List all players |
| GET | /players/{address} | Get player data |
| GET | /players/{address}/stats | Get player stats |
| GET | /players/{address}/assets | Get player assets |
| GET | /players/{address}/resources | Get player resources |
| GET | /players/{address}/quests | Get player quests |
| GET | /players/{address}/battles | Get player battles |
| GET | /players/{address}/stakes | Get player stakes |
| GET | /players/{address}/vesting | Get player vesting schedules |

### Tokens

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tokens/balances/{address} | Get token balances |
| GET | /tokens/transfers | Get token transfers |
| GET | /tokens/holders | Get token holders |

### NFTs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /nfts/assets | List all assets |
| GET | /nfts/assets/{tokenId} | Get asset details |
| GET | /nfts/resources | List all resources |
| GET | /nfts/resources/{resourceId} | Get resource details |
| GET | /nfts/owners/{address} | Get NFTs by owner |

### Marketplace

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /marketplace/listings | List all listings |
| GET | /marketplace/listings/{id} | Get listing details |
| GET | /marketplace/listings/seller/{address} | Listings by seller |
| GET | /marketplace/auctions | List all auctions |
| GET | /marketplace/sales | Get sales history |
| GET | /marketplace/search | Search listings |

### Game

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /game/quests | List all quests |
| GET | /game/quests/{id} | Get quest details |
| GET | /game/recipes | List all crafting recipes |
| GET | /game/recipes/{id} | Get recipe details |
| GET | /game/upgrade-recipes | List all upgrade recipes |
| GET | /game/leaderboard | Get PvP leaderboard |

### Staking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /staking/pools | List all pools |
| GET | /staking/pools/{id} | Get pool details |
| GET | /staking/stakes/{address} | Get user stakes |
| GET | /staking/rewards/{address} | Get user rewards |

### Vesting

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /vesting/schedules/{address} | Get vesting schedules |
| GET | /vesting/schedules/{address}/{id} | Get schedule details |
| GET | /vesting/claimable/{address} | Get claimable amount |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /analytics/volume | Get trading volume |
| GET | /analytics/players | Get player statistics |
| GET | /analytics/tokens | Get token statistics |
| GET | /analytics/contracts | Get contract statistics |

---

## Error Codes

### SDK Errors

| Code | Error | Description |
|------|-------|-------------|
| 1001 | NotConnectedError | Not connected to a provider |
| 1002 | NotSignedInError | No signer available |
| 2001 | ContractNotFoundError | Contract address not found |
| 3001 | InvalidNetworkError | Wrong network connected |
| 4001 | InsufficientBalanceError | Insufficient token balance |
| 4002 | ApprovalRequiredError | Token approval needed |

### HTTP Errors

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Free Tier**: 100 requests/minute
- **Pro Tier**: 1000 requests/minute
- **Enterprise**: Custom limits

---

## Versioning

All API endpoints are versioned. The current version is `v1`.

---

## License

Apache License 2.0

**Built with love by the LithosProtocol Team**
