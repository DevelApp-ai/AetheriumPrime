# LithosProtocol Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Contract Design](#contract-design)
4. [Token Economics](#token-economics)
5. [Game Mechanics](#game-mechanics)

## Overview

LithosProtocol is a comprehensive Web3 gaming ecosystem built on Ethereum.

### Key Features
- Dual Token Economy: Governance and Utility tokens
- NFT Asset System: ERC-721 and ERC-1155 based assets
- Play-to-Earn Mechanics: Quests, PvP, Crafting, Staking
- Decentralized Marketplace: Trading with auction support
- Multi-Signature Governance: Secure contract management

## System Architecture

### High-Level Architecture

```
LithosProtocol Ecosystem
├── Frontend (Web App, Unity Game, Mobile App, Admin Panel)
├── Backend (API Server, Indexer, Cache, Analytics)
└── Blockchain (Smart Contracts, RPC Node, IPFS Storage)
```

### Component Architecture

**Core Contracts (12):**
- GovernanceToken (ERC-20)
- UtilityToken (ERC-20)
- GameAssetNFT (ERC-721)
- GameResourceNFT (ERC-1155)
- GameLogic (Core P2E)
- GameLogicV2 (Enhanced P2E)
- Marketplace (Basic trading)
- MarketplaceV2 (Enhanced trading)
- StakingContract (DeFi)
- Vesting (Token distribution)

**Enhanced Contracts (5):**
- AdvancedTokenSinks (Deflationary mechanics)
- DynamicTokenomics (Dynamic pricing)
- GameOracle (Chainlink integration)
- PlayerDataStorage (Off-chain data)
- SignatureVerifier (EIP-712)

**P2 Contracts (1):**
- MultiSigWallet (Multi-signature governance)

## Contract Design

### Contract Hierarchy

All contracts follow these patterns:
- **UUPS Proxy Pattern**: For upgradeability
- **Access Control**: Role-based permissions
- **Pausable**: Emergency stop capability
- **Reentrancy Guards**: Protection against reentrancy attacks

### Contract Inheritance

```
GovernanceToken
├── ERC20Upgradeable
├── ERC20BurnableUpgradeable
├── ERC20PausableUpgradeable
├── ERC20VotesUpgradeable
├── OwnableUpgradeable
├── AccessControlUpgradeable
└── UUPSUpgradeable
```

## Token Economics

### Dual Token Model

**$GOV (Governance Token)**
- Total Supply: 1,000,000 tokens
- Use Cases: Governance voting, Premium features, Staking rewards
- Features: Voting, Pausable, Burnable, Permit support

**$PLAY (Utility Token)**
- Initial Supply: 0 (minted through gameplay)
- Use Cases: In-game purchases, Crafting, Repairs, Fees
- Features: Burnable, Pausable, Permit support

### Token Flow

**Sources (Inflationary):**
- Quest Rewards
- Staking Rewards
- Tournament Prizes
- Airdrops
- Referral Bonuses
- Daily Rewards

**Sinks (Deflationary):**
- Crafting Fees (10% annual)
- Marketplace Fees (2.5%)
- Repair Costs
- Premium Fees
- Burn Events

## Game Mechanics

### Play-to-Earn System

**1. Quest System**
- Daily, Weekly, Monthly quests
- Various objective types
- Base reward + Dynamic bonus
- Experience points

**2. PvP Battle System**
- 1v1 Duels, Team Battles, Tournaments
- Rating-based matchmaking (ELO system)
- Winner takes all + Rating bonuses
- Damage system with weapon/player stats

**3. Crafting System**
- Weapon, Armor, Accessory, Potion, Consumable crafting
- Success rates by rarity (90% Common to 10% Legendary)
- Resource requirements by tier
- Dynamic pricing via DynamicTokenomics

**4. Asset Progression**
- Experience system with level thresholds
- Rarity upgrades (Common → Legendary)
- Stat improvements (Health, Damage, Defense, Speed)
- Maximum level: 100

### Player Data Structure

```solidity
struct PlayerData {
    uint256 level;
    uint256 experience;
    uint256 pvpWins;
    uint256 pvpLosses;
    uint256 pvpRating;
    uint256 totalDamageDealt;
    uint256 totalDamageTaken;
    bool isActive;
    uint256 lastActivityTime;
}
```

## Security Architecture

### Security Layers

1. **Smart Contract Security**
   - Reentrancy Protection
   - Input Validation
   - Overflow Protection
   - Access Control
   - Pausable Contracts
   - UUPS Pattern

2. **Economic Security**
   - Deflationary Mechanics
   - Inflation Control
   - Dynamic Pricing
   - Sustainable Staking Rewards
   - Balanced Fee Structure

3. **Operational Security**
   - Multi-Signature Wallet
   - Time-locks
   - Rate Limiting
   - Event Logging
   - Admin Controls

### Security Features by Contract

All 18 contracts implement:
- ✅ Reentrancy Guard
- ✅ Access Control
- ✅ Pausable
- ✅ UUPS Proxy
- ✅ Input Validation

## Integration Architecture

### Web3 SDK

**Structure:**
```
LithosProtocolSDK
├── player: PlayerModule
├── token: TokenModule
├── nft: NFTModule
├── game: GameModule
├── marketplace: MarketplaceModule
├── staking: StakingModule
├── vesting: VestingModule
├── config: NetworkConfig
├── provider: Provider
├── signer: Signer
└── logger: DebugLogger
```

**Supported Networks:**
- Ethereum Mainnet (Chain ID: 1)
- Sepolia Testnet (Chain ID: 11155111)
- Localhost (Chain ID: 31337)

### Unity SDK

**Platform Support:**
- WebGL (MetaMask, WalletConnect)
- Android (Java provider)
- iOS (Swift/Obj-C provider)
- Standalone (Generic provider)

## Data Flow

### Player Action Flow

1. Player triggers action in frontend
2. SDK validates and constructs transaction
3. Signer signs transaction
4. Transaction sent to network
5. SDK waits for confirmation
6. SDK processes result and emits events
7. Frontend updates UI

### Event Flow

1. Contract emits event
2. Event stored in transaction receipt
3. Indexer detects and stores event
4. SDK subscribes to event type
5. SDK polls for new events
6. SDK calls registered callbacks
7. Frontend updates based on event

## Deployment Architecture

### Deployment Process

1. **Development**
   - Write and test contracts on localhost
   - Use anvil for local blockchain
   - Run comprehensive tests

2. **Testnet Deployment**
   - Deploy to Sepolia testnet
   - Test with real wallets
   - Verify all functionality
   - Test upgrade process

3. **Production Deployment**
   - Deploy implementation contracts
   - Deploy proxy contracts
   - Initialize contracts
   - Configure parameters
   - Verify on Etherscan

4. **Post-Deployment**
   - Set up monitoring
   - Configure indexer
   - Update frontend configuration
   - Announce to community

### Deployment Scripts

| Script | Purpose | Networks |
|--------|---------|----------|
| DeployContracts.s.sol | Deploy core contracts | All |
| DeployAllContracts.s.sol | Deploy all contracts (P0) | All |
| DeployCompleteSystem.s.sol | Deploy complete system (P0 + P1) | All |
| DeployCompleteSystemWithP2.s.sol | Deploy complete system with P2 | All |

## Best Practices

### Smart Contract Development
1. Always use OpenZeppelin libraries
2. Use UUPS pattern for upgradeable contracts
3. Implement reentrancy guards
4. Validate all inputs
5. Use events for state changes
6. Follow Solidity style guide
7. Write comprehensive tests
8. Use NatSpec comments

### Security Best Practices
1. Principle of Least Privilege
2. Defense in Depth
3. Fail Secure
4. Transparency
5. Comprehensive Testing
6. Real-time Monitoring
7. Incident Response Plan

### Gas Optimization
1. Minimize storage writes
2. Pack variables
3. Avoid loops (especially unbounded)
4. Use calldata instead of memory
5. Cache values
6. Use efficient data structures

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Transaction reverted | Insufficient gas | Increase gas limit |
| Transaction reverted | Insufficient balance | Get more tokens |
| Transaction reverted | Not approved | Approve token spending |
| Transaction reverted | Not owner | Use owner account |
| Transaction reverted | Paused | Wait for unpause |
| Event not detected | Wrong network | Check network |
| Contract not found | Wrong address | Verify address |

### Debugging Tools
1. Foundry: `forge test -vv`
2. Etherscan: Verify contracts
3. Tenderly: Debug transactions
4. Hardhat Console: Debug with console.log
5. Remix: Interactive debugging

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01 | Initial release |
| 1.1.0 | 2024-02 | Added V2 contracts |
| 1.2.0 | 2024-03 | Added P2 features |
| 1.3.0 | 2024-04 | Documentation updates |

## License

Apache License 2.0

**Built with love by the LithosProtocol Team**
