# LithosProtocol Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Web3 SDK Integration](#web3-sdk-integration)
4. [Unity SDK Integration](#unity-sdk-integration)
5. [Smart Contract Integration](#smart-contract-integration)
6. [Backend Integration](#backend-integration)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## Overview

This guide provides comprehensive instructions for integrating LithosProtocol into your applications. Whether you're building a web application, Unity game, or backend service, this guide will help you get started.

### Supported Platforms

| Platform | SDK | Language | Status |
|----------|-----|----------|--------|
| Web (Browser) | Web3 SDK | TypeScript/JavaScript | ✅ Production Ready |
| Unity | Unity SDK | C# | ✅ Production Ready |
| Backend | REST API | Any | ✅ Production Ready |
| Mobile (React Native) | Web3 SDK | TypeScript/JavaScript | ✅ Production Ready |
| Node.js | Web3 SDK | TypeScript/JavaScript | ✅ Production Ready |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ (for Web3 SDK)
- **Unity** 2021.3+ (for Unity SDK)
- **Foundry** (for smart contract development)
- **MetaMask** or other Web3 wallet
- **Infura/Alchemy** RPC provider (or your own node)

### Installation

#### Web3 SDK

```bash
# Install via npm
npm install @lithosprotocol/web3-sdk

# Or via yarn
yarn add @lithosprotocol/web3-sdk
```

#### Unity SDK

1. Download the latest Unity SDK from [GitHub Releases](https://github.com/DevelApp-ai/LithosProtocol/releases)
2. Import the package into your Unity project
3. Follow the Unity-specific setup instructions below

---

## Web3 SDK Integration

### Basic Setup

```typescript
import { LithosProtocolSDK } from '@lithosprotocol/web3-sdk';

// Initialize the SDK
const sdk = new LithosProtocolSDK({
  network: 'sepolia', // 'mainnet' or 'sepolia'
  debug: false
});

// Connect to a wallet
await sdk.initialize(window.ethereum);
await sdk.connectWallet(window.ethereum);

// Check connection status
console.log('Is connected:', sdk.isConnected);
console.log('Is signed in:', sdk.isSignedIn);
console.log('Current address:', await sdk.getAddress());
```

### Complete Web Application Example

```typescript
import React, { useState, useEffect } from 'react';
import { LithosProtocolSDK } from '@lithosprotocol/web3-sdk';

declare global {
  interface Window {
    ethereum: any;
  }
}

function App() {
  const [sdk, setSdk] = useState<LithosProtocolSDK | null>(null);
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize SDK
  useEffect(() => {
    const initSdk = async () => {
      const newSdk = new LithosProtocolSDK({
        network: 'sepolia',
        debug: true
      });
      
      await newSdk.initialize(window.ethereum);
      setSdk(newSdk);
    };
    
    initSdk();
  }, []);

  // Connect wallet
  const connectWallet = async () => {
    if (!sdk) return;
    
    setIsLoading(true);
    try {
      await sdk.connectWallet(window.ethereum);
      const addr = await sdk.getAddress();
      setAddress(addr);
      
      // Get token balance
      const govBalance = await sdk.token.getBalance('governance');
      const playBalance = await sdk.token.getBalance('utility');
      
      console.log('GOV Balance:', govBalance.toString());
      console.log('PLAY Balance:', playBalance.toString());
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Claim daily reward
  const claimDailyReward = async () => {
    if (!sdk) return;
    
    setIsLoading(true);
    try {
      const txHash = await sdk.player.claimDailyReward();
      console.log('Transaction hash:', txHash);
      
      // Wait for confirmation
      const receipt = await sdk.waitForConfirmation(txHash, 1);
      console.log('Transaction confirmed:', receipt);
    } catch (error) {
      console.error('Error claiming reward:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get player data
  const getPlayerData = async () => {
    if (!sdk || !address) return;
    
    try {
      const playerData = await sdk.player.getPlayerData();
      console.log('Player data:', playerData);
    } catch (error) {
      console.error('Error getting player data:', error);
    }
  };

  return (
    <div>
      <h1>LithosProtocol Integration</h1>
      
      {!address ? (
        <button onClick={connectWallet} disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div>
          <p>Connected: {address}</p>
          <button onClick={claimDailyReward} disabled={isLoading}>
            Claim Daily Reward
          </button>
          <button onClick={getPlayerData} disabled={isLoading}>
            Get Player Data
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
```

### React Hooks for LithosProtocol

```typescript
// useLithos.ts
import { useState, useEffect, useCallback } from 'react';
import { LithosProtocolSDK } from '@lithosprotocol/web3-sdk';

export function useLithos() {
  const [sdk, setSdk] = useState<LithosProtocolSDK | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize SDK
  useEffect(() => {
    const init = async () => {
      try {
        const newSdk = new LithosProtocolSDK({
          network: 'sepolia',
          debug: process.env.NODE_ENV === 'development'
        });
        
        await newSdk.initialize(window.ethereum);
        setSdk(newSdk);
        setIsConnected(newSdk.isConnected);
        
        if (newSdk.isSignedIn) {
          const addr = await newSdk.getAddress();
          setAddress(addr);
        }
      } catch (err) {
        setError(err as Error);
      }
    };
    
    init();
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!sdk) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await sdk.connectWallet(window.ethereum);
      const addr = await sdk.getAddress();
      setAddress(addr);
      setIsConnected(true);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    if (!sdk) return;
    
    sdk.disconnectWallet();
    setAddress('');
    setIsConnected(false);
  }, [sdk]);

  // Execute transaction with error handling
  const executeTx = useCallback(async (
    fn: () => Promise<string>,
    onSuccess?: (txHash: string) => void,
    onError?: (error: Error) => void
  ) => {
    if (!sdk) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const txHash = await fn();
      if (onSuccess) onSuccess(txHash);
      
      // Wait for confirmation
      const receipt = await sdk.waitForConfirmation(txHash, 1);
      return receipt;
    } catch (err) {
      setError(err as Error);
      if (onError) onError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  return {
    sdk,
    address,
    isConnected,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    executeTx
  };
}
```

---

## Unity SDK Integration

### Basic Setup

```csharp
using UnityEngine;
using LithosProtocol.Unity;

public class LithosManager : MonoBehaviour
{
    public static LithosManager Instance { get; private set; }
    
    public LithosProtocolUnity Lithos { get; private set; }
    public string CurrentAddress { get; private set; }
    public bool IsConnected => Lithos != null && Lithos.IsSignedIn;
    
    [Header("Configuration")]
    public Network network = Network.Sepolia;
    public string rpcUrl = "https://sepolia.infura.io/v3/YOUR_KEY";
    
    [Header("Contract Addresses")]
    public string governanceTokenAddress;
    public string utilityTokenAddress;
    public string gameLogicAddress;
    public string marketplaceAddress;
    public string stakingAddress;
    
    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }
    
    async void Start()
    {
        await InitializeLithos();
    }
    
    public async Task InitializeLithos()
    {
        var config = new LithosConfig
        {
            Network = network,
            RpcUrl = rpcUrl,
            ContractAddresses = new ContractAddresses
            {
                GovernanceToken = governanceTokenAddress,
                UtilityToken = utilityTokenAddress,
                GameLogic = gameLogicAddress,
                Marketplace = marketplaceAddress,
                Staking = stakingAddress
            },
            Debug = Debug.isDebugBuild
        };
        
        Lithos = new LithosProtocolUnity();
        await Lithos.Initialize(config);
        
        Debug.Log("LithosProtocol initialized");
    }
    
    public async Task ConnectWallet()
    {
        if (Lithos == null)
        {
            Debug.LogError("Lithos not initialized");
            return;
        }
        
        try
        {
            await Lithos.ConnectWallet();
            CurrentAddress = await Lithos.GetAddress();
            Debug.Log("Connected: " + CurrentAddress);
        }
        catch (Exception ex)
        {
            Debug.LogError("Failed to connect wallet: " + ex.Message);
            throw;
        }
    }
    
    public void DisconnectWallet()
    {
        if (Lithos != null)
        {
            Lithos.DisconnectWallet();
            CurrentAddress = null;
        }
    }
}
```

### Unity UI Integration

```csharp
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using LithosProtocol.Unity;

public class LithosUI : MonoBehaviour
{
    [Header("References")]
    public Button connectButton;
    public Button claimButton;
    public Button refreshButton;
    public TMP_Text addressText;
    public TMP_Text govBalanceText;
    public TMP_Text playBalanceText;
    public TMP_Text statusText;
    
    private async void Start()
    {
        connectButton.onClick.AddListener(OnConnectClicked);
        claimButton.onClick.AddListener(OnClaimClicked);
        refreshButton.onClick.AddListener(OnRefreshClicked);
        
        UpdateUI();
    }
    
    private async void OnConnectClicked()
    {
        try
        {
            await LithosManager.Instance.ConnectWallet();
            UpdateUI();
        }
        catch (Exception ex)
        {
            statusText.text = "Error: " + ex.Message;
        }
    }
    
    private async void OnClaimClicked()
    {
        if (!LithosManager.Instance.IsConnected)
        {
            statusText.text = "Not connected";
            return;
        }
        
        try
        {
            statusText.text = "Claiming daily reward...";
            string txHash = await LithosManager.Instance.Lithos.Player.ClaimDailyReward();
            statusText.text = "Transaction sent: " + txHash;
            
            // Wait a bit and refresh
            await Task.Delay(3000);
            UpdateUI();
        }
        catch (Exception ex)
        {
            statusText.text = "Error: " + ex.Message;
        }
    }
    
    private async void OnRefreshClicked()
    {
        UpdateUI();
    }
    
    private async void UpdateUI()
    {
        if (LithosManager.Instance.IsConnected)
        {
            addressText.text = LithosManager.Instance.CurrentAddress;
            connectButton.gameObject.SetActive(false);
            
            try
            {
                var govBalance = await LithosManager.Instance.Lithos.Token.GetBalance(TokenType.Governance);
                var playBalance = await LithosManager.Instance.Lithos.Token.GetBalance(TokenType.Utility);
                
                govBalanceText.text = "GOV: " + govBalance.ToString();
                playBalanceText.text = "PLAY: " + playBalance.ToString();
                
                statusText.text = "Connected";
            }
            catch (Exception ex)
            {
                statusText.text = "Error: " + ex.Message;
            }
        }
        else
        {
            addressText.text = "Not connected";
            govBalanceText.text = "GOV: 0";
            playBalanceText.text = "PLAY: 0";
            statusText.text = "Disconnected";
            connectButton.gameObject.SetActive(true);
        }
    }
}
```

---

## Smart Contract Integration

### Direct Contract Interaction

```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyContract {
    address public governanceTokenAddress;
    address public utilityTokenAddress;
    address public gameLogicAddress;
    
    constructor(
        address _governanceToken,
        address _utilityToken,
        address _gameLogic
    ) {
        governanceTokenAddress = _governanceToken;
        utilityTokenAddress = _utilityToken;
        gameLogicAddress = _gameLogic;
    }
    
    function depositTokens(uint256 amount) external {
        // Transfer tokens from user to this contract
        IERC20(governanceTokenAddress).transferFrom(msg.sender, address(this), amount);
    }
    
    function withdrawTokens(uint256 amount) external {
        // Transfer tokens from this contract to user
        IERC20(governanceTokenAddress).transfer(msg.sender, amount);
    }
    
    function getTokenBalance() external view returns (uint256) {
        // Get token balance of this contract
        return IERC20(governanceTokenAddress).balanceOf(address(this));
    }
}
```

### Using Interfaces

```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;

import "../../src/interfaces/IGameLogic.sol";
import "../../src/interfaces/IUtilityToken.sol";

contract MyGameIntegration {
    IGameLogic public gameLogic;
    IUtilityToken public utilityToken;
    
    constructor(address _gameLogic, address _utilityToken) {
        gameLogic = IGameLogic(_gameLogic);
        utilityToken = IUtilityToken(_utilityToken);
    }
    
    function registerPlayer() external {
        // Register player through GameLogic
        gameLogic.registerPlayer(msg.sender);
    }
    
    function completeQuest(uint256 questId) external {
        // Complete a quest
        gameLogic.completeQuest(questId);
    }
    
    function claimDailyReward() external {
        // Claim daily reward
        gameLogic.claimDailyReward();
    }
    
    function getPlayerData(address player) external view returns (PlayerData memory) {
        // Get player data
        return gameLogic.getPlayerData(player);
    }
}
```

---

## Backend Integration

### REST API Client

```typescript
// lithosApi.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface LithosApiConfig {
  baseUrl?: string;
  apiKey?: string;
  network?: 'mainnet' | 'sepolia';
}

export class LithosApi {
  private client: AxiosInstance;
  private config: LithosApiConfig;

  constructor(config: LithosApiConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || (config.network === 'mainnet' 
        ? 'https://api.lithosprotocol.io/v1'
        : 'https://api-testnet.lithosprotocol.io/v1'),
      apiKey: config.apiKey,
      network: config.network || 'sepolia'
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : undefined,
        'Content-Type': 'application/json'
      }
    });
  }

  // Players
  async getPlayer(address: string) {
    return this.client.get(`/players/${address}`);
  }

  async getPlayerAssets(address: string) {
    return this.client.get(`/players/${address}/assets`);
  }

  async getPlayerResources(address: string) {
    return this.client.get(`/players/${address}/resources`);
  }

  // Tokens
  async getTokenBalances(address: string) {
    return this.client.get(`/tokens/balances/${address}`);
  }

  // Marketplace
  async getListings(params: {
    categoryId?: number;
    minRarity?: number;
    maxRarity?: number;
    minPrice?: string;
    maxPrice?: string;
    seller?: string;
    listingType?: number;
    page?: number;
    pageSize?: number;
  }) {
    return this.client.get('/marketplace/listings', { params });
  }

  async getListing(listingId: string) {
    return this.client.get(`/marketplace/listings/${listingId}`);
  }

  // Analytics
  async getAnalytics() {
    return this.client.get('/analytics/volume');
  }

  // Error handling
  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      throw new Error(`API Error: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

// Usage
const api = new LithosApi({
  network: 'sepolia',
  apiKey: 'YOUR_API_KEY'
});

const playerData = await api.getPlayer('0x123...');
const listings = await api.getListings({ categoryId: 1, page: 1, pageSize: 20 });
```

### Backend Service with Web3

```typescript
// lithosService.ts
import { ethers } from 'ethers';
import { LithosProtocolSDK } from '@lithosprotocol/web3-sdk';

export class LithosService {
  private sdk: LithosProtocolSDK;
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;

  constructor(
    private readonly config: {
      network: 'mainnet' | 'sepolia' | 'localhost';
      rpcUrl: string;
      privateKey?: string;
      contractAddresses?: {
        governanceToken?: string;
        utilityToken?: string;
        gameLogic?: string;
        marketplace?: string;
        staking?: string;
      };
    }
  ) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    this.sdk = new LithosProtocolSDK({
      network: config.network,
      contracts: config.contractAddresses || {},
      debug: process.env.NODE_ENV === 'development'
    });

    if (config.privateKey) {
      this.signer = new ethers.Wallet(config.privateKey, this.provider);
    }
  }

  async initialize() {
    await this.sdk.initialize(this.provider);
    if (this.signer) {
      await this.sdk.connectWallet(this.signer);
    }
  }

  // Player operations
  async registerPlayer(referrer?: string) {
    return this.sdk.player.registerPlayer(referrer || ethers.ZeroAddress);
  }

  async getPlayerData(address: string) {
    return this.sdk.player.getPlayerData(address);
  }

  // Token operations
  async getTokenBalance(address: string, tokenType: 'governance' | 'utility') {
    return this.sdk.token.getBalance(tokenType, address);
  }

  async transferTokens(
    tokenType: 'governance' | 'utility',
    to: string,
    amount: bigint
  ) {
    return this.sdk.token.transfer(tokenType, to, amount);
  }

  // Marketplace operations
  async createListing(
    nftContract: string,
    tokenId: bigint,
    amount: bigint,
    listingType: number,
    paymentToken: string,
    price: bigint,
    duration: bigint
  ) {
    return this.sdk.marketplace.createListing(
      nftContract,
      tokenId,
      amount,
      listingType,
      paymentToken,
      price,
      duration
    );
  }

  // Batch operations
  async batchTransferTokens(
    tokenType: 'governance' | 'utility',
    transfers: Array<{ to: string; amount: bigint }>
  ) {
    const txHashes = [];
    for (const transfer of transfers) {
      const txHash = await this.transferTokens(
        tokenType,
        transfer.to,
        transfer.amount
      );
      txHashes.push(txHash);
    }
    return txHashes;
  }

  // Event monitoring
  async monitorEvents() {
    this.sdk.on('playerRegistered', (player) => {
      console.log('Player registered:', player);
    });

    this.sdk.on('questCompleted', (player, questId, reward) => {
      console.log('Quest completed:', { player, questId, reward });
    });

    this.sdk.on('itemListed', (listingId, seller, nftContract, tokenId) => {
      console.log('Item listed:', { listingId, seller, nftContract, tokenId });
    });
  }
}

// Usage
const service = new LithosService({
  network: 'sepolia',
  rpcUrl: 'https://sepolia.infura.io/v3/YOUR_KEY',
  privateKey: 'YOUR_PRIVATE_KEY',
  contractAddresses: {
    governanceToken: '0x123...',
    utilityToken: '0x456...',
    gameLogic: '0x789...'
  }
});

await service.initialize();

// Use the service
const playerData = await service.getPlayerData('0x123...');
const txHash = await service.transferTokens('governance', '0x456...', 100n);
```

---

## Testing

### Testing with Foundry

```solidity
// test/MyContract.t.sol
// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/tokens/GovernanceToken.sol";
import "../src/tokens/UtilityToken.sol";

contract MyContractTest is Test {
    GovernanceToken public governanceToken;
    UtilityToken public utilityToken;
    
    address public owner = address(1);
    address public player1 = address(2);
    address public player2 = address(3);

    function setUp() public {
        // Deploy contracts
        governanceToken = new GovernanceToken();
        utilityToken = new UtilityToken();

        // Initialize contracts
        governanceToken.initialize(
            "Aetherium Governance",
            "GOV",
            1000000 * 10**18,
            owner
        );
        utilityToken.initialize(
            "Aetherium Play",
            "PLAY",
            0,
            owner
        );

        // Mint tokens to players
        vm.prank(owner);
        governanceToken.mint(player1, 1000 * 10**18);
        governanceToken.mint(player2, 1000 * 10**18);
    }

    function test_TokenTransfer() public {
        // Transfer tokens from player1 to player2
        vm.prank(player1);
        governanceToken.transfer(player2, 100 * 10**18);

        // Check balances
        assertEq(governanceToken.balanceOf(player1), 900 * 10**18);
        assertEq(governanceToken.balanceOf(player2), 1100 * 10**18);
    }

    function testFail_TokenTransfer_InsufficientBalance() public {
        // Try to transfer more than balance
        vm.prank(player1);
        vm.expectRevert("ERC20: transfer amount exceeds balance");
        governanceToken.transfer(player2, 2000 * 10**18);
    }
}
```

### Testing with Hardhat

```typescript
// test/MyContract.test.ts
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { LithosProtocolSDK } from '@lithosprotocol/web3-sdk';

describe('LithosProtocol Integration', function () {
  let sdk: LithosProtocolSDK;
  let owner: any;
  let player1: any;
  let player2: any;

  before(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    sdk = new LithosProtocolSDK({
      network: 'localhost',
      debug: true
    });

    await sdk.initialize(owner.provider);
  });

  describe('Player Operations', function () {
    it('should register a player', async function () {
      const txHash = await sdk.player.registerPlayer(player1.address);
      const receipt = await sdk.waitForConfirmation(txHash, 1);
      
      expect(receipt.status).to.equal(1);
    });

    it('should get player data', async function () {
      const playerData = await sdk.player.getPlayerData(player1.address);
      
      expect(playerData).to.not.be.null;
    });
  });

  describe('Token Operations', function () {
    it('should transfer tokens', async function () {
      const amount = ethers.parseEther('100');
      const txHash = await sdk.token.transfer(
        'governance',
        player2.address,
        amount
      );
      
      const receipt = await sdk.waitForConfirmation(txHash, 1);
      expect(receipt.status).to.equal(1);
    });

    it('should get token balance', async function () {
      const balance = await sdk.token.getBalance('governance', player1.address);
      expect(balance).to.be.a.bignumber;
    });
  });
});
```

---

## Deployment

### Deploying Smart Contracts

```bash
# Compile contracts
forge build

# Deploy to local network
anvil
forge script script/DeployContracts.s.sol --rpc-url http://localhost:8545 --broadcast

# Deploy to Sepolia testnet
forge script script/DeployContracts.s.sol --rpc-url https://sepolia.infura.io/v3/YOUR_KEY --broadcast

# Deploy to Ethereum mainnet
forge script script/DeployContracts.s.sol --rpc-url https://mainnet.infura.io/v3/YOUR_KEY --broadcast
```

### Deployment Script Example

```solidity
// script/DeployCompleteSystem.s.sol
// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/tokens/GovernanceToken.sol";
import "../src/tokens/UtilityToken.sol";
import "../src/nfts/GameAssetNFT.sol";
import "../src/nfts/GameResourceNFT.sol";
import "../src/game/GameLogic.sol";
import "../src/marketplace/Marketplace.sol";
import "../src/defi/StakingContract.sol";
import "../src/vesting/Vesting.sol";
import "../src/governance/MultiSigWallet.sol";

contract DeployCompleteSystem is Script {
    using stdError for *;

    function run() external {
        // Get deployer address
        address deployer = msg.sender;

        // Deploy tokens
        GovernanceToken governanceToken = new GovernanceToken();
        UtilityToken utilityToken = new UtilityToken();

        // Initialize tokens
        governanceToken.initialize(
            "Aetherium Governance",
            "GOV",
            1000000 * 10**18,
            deployer
        );
        utilityToken.initialize(
            "Aetherium Play",
            "PLAY",
            0,
            deployer
        );

        // Deploy NFTs
        GameAssetNFT gameAssetNFT = new GameAssetNFT();
        GameResourceNFT gameResourceNFT = new GameResourceNFT();

        gameAssetNFT.initialize(
            "LithosProtocol Assets",
            "LPA",
            "ipfs://assets/",
            deployer
        );
        gameResourceNFT.initialize(
            "LithosProtocol Resources",
            "LPR",
            "ipfs://resources/",
            deployer
        );

        // Deploy GameLogic
        GameLogic gameLogic = new GameLogic();
        gameLogic.initialize(
            address(governanceToken),
            address(utilityToken),
            address(gameAssetNFT),
            address(gameResourceNFT),
            deployer,
            100 * 10**18 // Daily reward
        );

        // Deploy Marketplace
        Marketplace marketplace = new Marketplace();
        marketplace.initialize(
            address(governanceToken),
            address(utilityToken),
            address(gameAssetNFT),
            address(gameResourceNFT),
            deployer,
            250 // 2.5% fee
        );

        // Deploy Staking
        StakingContract staking = new StakingContract();
        staking.initialize(
            address(governanceToken),
            address(utilityToken),
            deployer,
            1000 // 10% reward rate
        );

        // Deploy Vesting
        Vesting vesting = new Vesting();
        vesting.initialize(
            address(governanceToken),
            deployer
        );

        // Deploy MultiSigWallet
        address[] memory owners = new address[](1);
        owners[0] = deployer;
        MultiSigWallet multiSig = new MultiSigWallet();
        multiSig.initialize(owners, 1);

        // Log deployed addresses
        console.log("Deployed Contracts:");
        console.log("GovernanceToken:", address(governanceToken));
        console.log("UtilityToken:", address(utilityToken));
        console.log("GameAssetNFT:", address(gameAssetNFT));
        console.log("GameResourceNFT:", address(gameResourceNFT));
        console.log("GameLogic:", address(gameLogic));
        console.log("Marketplace:", address(marketplace));
        console.log("StakingContract:", address(staking));
        console.log("Vesting:", address(vesting));
        console.log("MultiSigWallet:", address(multiSig));

        // Transfer ownership to MultiSig
        governanceToken.grantRole(keccak256("DEFAULT_ADMIN_ROLE"), address(multiSig));
        utilityToken.grantRole(keccak256("DEFAULT_ADMIN_ROLE"), address(multiSig));
        gameAssetNFT.grantRole(keccak256("DEFAULT_ADMIN_ROLE"), address(multiSig));
        gameResourceNFT.grantRole(keccak256("DEFAULT_ADMIN_ROLE"), address(multiSig));
        gameLogic.grantRole(keccak256("DEFAULT_ADMIN_ROLE"), address(multiSig));
        marketplace.grantRole(keccak256("DEFAULT_ADMIN_ROLE"), address(multiSig));
        staking.grantRole(keccak256("DEFAULT_ADMIN_ROLE"), address(multiSig));
        vesting.grantRole(keccak256("DEFAULT_ADMIN_ROLE"), address(multiSig));

        console.log("Ownership transferred to MultiSigWallet");
    }
}
```

### Environment Variables

Create a `.env` file for your deployment:

```bash
# .env
RPC_URL_MAINNET=https://mainnet.infura.io/v3/YOUR_KEY
RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=YOUR_PRIVATE_KEY

# Contract addresses (after deployment)
GOVERNANCE_TOKEN=0x123...
UTILITY_TOKEN=0x456...
GAME_ASSET_NFT=0x789...
GAME_RESOURCE_NFT=0xabc...
GAME_LOGIC=0xdef...
MARKETPLACE=0xghi...
STAKING=0xjkl...
VESTING=0xmno...
MULTI_SIG=0xpqr...
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Connection failed | Check RPC URL and network configuration |
| Transaction reverted | Check gas limit and token balances |
| Contract not found | Verify contract address and network |
| Insufficient balance | Get more tokens or check approvals |
| Approval required | Approve token spending before transfer |
| Network error | Check your internet connection |
| Nonce too low | Reset your wallet or use a new account |

### Debugging Tips

1. **Enable debug mode** in the SDK:
   ```typescript
   const sdk = new LithosProtocolSDK({ debug: true });
   ```

2. **Check transaction receipts** for errors:
   ```typescript
   const receipt = await sdk.getTransactionReceipt(txHash);
   console.log('Receipt:', receipt);
   ```

3. **Use Tenderly** for transaction debugging:
   ```typescript
   // Add Tenderly to your project
   import { Tenderly } from '@tenderly/sdk';
   
   // Initialize Tenderly
   const tenderly = new Tenderly({
     accessKey: 'YOUR_ACCESS_KEY',
     accountName: 'YOUR_ACCOUNT',
     projectName: 'YOUR_PROJECT'
   });
   
   // Simulate and debug transactions
   const simulation = await tenderly.simulate(txHash);
   ```

4. **Check contract state** on Etherscan or similar block explorers

5. **Verify contract addresses** match the expected network

---

## Best Practices

### Security Best Practices

1. **Never expose private keys** in client-side code
2. **Use environment variables** for sensitive data
3. **Validate all inputs** on both client and server
4. **Implement rate limiting** for API endpoints
5. **Use HTTPS** for all communications
6. **Store sensitive data encrypted**
7. **Regularly audit** your smart contracts

### Performance Best Practices

1. **Batch operations** where possible
2. **Cache frequently accessed data**
3. **Use efficient data structures**
4. **Minimize storage writes**
5. **Use events for state changes**
6. **Consider gas costs** for all operations

### User Experience Best Practices

1. **Provide clear error messages**
2. **Show loading indicators** for async operations
3. **Handle errors gracefully**
4. **Provide feedback** for all user actions
5. **Optimize for mobile** if targeting mobile users
6. **Test on multiple wallets** (MetaMask, WalletConnect, etc.)

---

## Support

For support, please:

1. Check the [FAQ](#) (coming soon)
2. Search the [GitHub Issues](https://github.com/DevelApp-ai/LithosProtocol/issues)
3. Ask in the [Discord](https://discord.gg/YOUR_INVITE) (coming soon)
4. Open a new [GitHub Issue](https://github.com/DevelApp-ai/LithosProtocol/issues/new)

---

## License

Apache License 2.0

**Built with love by the LithosProtocol Team**
