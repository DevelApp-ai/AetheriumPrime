# LithosProtocol Unity SDK

## Overview

The LithosProtocol Unity SDK provides seamless integration between Unity games and the LithosProtocol blockchain. This SDK allows game developers to easily interact with smart contracts, manage player data, handle NFTs, and process transactions.

## Features

- **Easy Integration**: Simple setup with Unity's MonoBehaviour system
- **Web3 Provider**: Built-in support for Web3 providers (MetaMask, WalletConnect)
- **Contract Interaction**: Type-safe contract method calls
- **Event Handling**: Automatic event listening and processing
- **Error Handling**: Comprehensive error management
- **Cross-Platform**: Works on WebGL, Android, iOS, and standalone platforms

## Installation

### Option 1: Clone Repository

```bash
git clone https://github.com/DevelApp-ai/LithosProtocol.git
cd LithosProtocol/unity
```

### Option 2: Download Release

Download the latest release from GitHub and import the `unity` folder into your Unity project's Assets folder.

## Setup

### 1. Import into Unity

- Copy the `unity` folder to your Unity project's `Assets` directory
- Unity will automatically import the scripts

### 2. Configure Network Settings

Create a configuration script or use the default settings:

```csharp
using LithosProtocol.Unity;

public class GameConfig : MonoBehaviour
{
    public string RpcUrl = "https://sepolia.infura.io/v3/YOUR_INFURA_KEY";
    public int ChainId = 11155111; // Sepolia
    public string GovernanceTokenAddress = "0x...";
    public string UtilityTokenAddress = "0x...";
    // ... other contract addresses
}
```

### 3. Initialize the SDK

```csharp
using LithosProtocol.Unity;
using UnityEngine;

public class BlockchainManager : MonoBehaviour
{
    private LithosProtocolUnity _lithos;
    
    async void Start()
    {
        // Initialize with default configuration
        _lithos = new LithosProtocolUnity();
        
        // Or with custom configuration
        var config = new LithosConfig
        {
            Network = Network.Sepolia,
            RpcUrl = "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
            ContractAddresses = new ContractAddresses
            {
                GovernanceToken = "0x...",
                UtilityToken = "0x...",
                // ... other addresses
            }
        };
        
        await _lithos.Initialize(config);
        
        // Connect wallet
        await _lithos.ConnectWallet();
    }
}
```

## Usage

### Player Management

```csharp
// Register a new player
string txHash = await lithos.Player.RegisterPlayer("0x"); // referrer address

// Get player data
var playerData = await lithos.Player.GetPlayerData();
Debug.Log($