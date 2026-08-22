// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../src/GovernanceToken.sol";
import "../src/UtilityToken.sol";
import "../src/GameAssetNFT.sol";
import "../src/GameResourceNFT.sol";
import "../src/GameLogic.sol";
import "../src/Marketplace.sol";
import "../src/StakingContract.sol";
import "../src/Vesting.sol";
import "../src/enhanced/AdvancedTokenSinks.sol";
import "../src/enhanced/DynamicTokenomics.sol";
import "../src/oracles/GameOracle.sol";
import "../src/libraries/PlayerDataStorage.sol";
import "../src/libraries/SignatureVerifier.sol";

/**
 * @title DeployAllContracts
 * @dev Complete deployment script for all LithosProtocol contracts
 * Deploys core contracts, enhanced features, and libraries with proper initialization
 */
contract DeployAllContracts is Script {
    // Deployment configuration
    struct DeploymentConfig {
        string govTokenName;
        string govTokenSymbol;
        uint256 govTokenSupply;
        string utilityTokenName;
        string utilityTokenSymbol;
        uint256 utilityTokenSupply;
        string assetNFTName;
        string assetNFTSymbol;
        string resourceNFTURI;
        uint256 marketplaceFee; // in basis points
    }

    // Deployed contract addresses
    struct DeployedContracts {
        address governanceToken;
        address utilityToken;
        address gameAssetNFT;
        address gameResourceNFT;
        address gameLogic;
        address marketplace;
        address stakingContract;
        address vesting;
        address advancedTokenSinks;
        address dynamicTokenomics;
        address gameOracle;
        address playerDataStorage;
        address signatureVerifier;
    }

    function run() external virtual returns (DeployedContracts memory) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying all LithosProtocol contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Get deployment configuration
        DeploymentConfig memory config = getDeploymentConfig();

        // Deploy all contracts
        DeployedContracts memory contracts = deployAllContracts(config, deployer);

        // Setup initial configuration
        setupInitialConfiguration(contracts, deployer);

        // Deploy enhanced contracts
        deployEnhancedContracts(contracts, deployer);

        vm.stopBroadcast();

        // Log deployment addresses
        logDeploymentAddresses(contracts);

        return contracts;
    }

    function getDeploymentConfig() internal pure returns (DeploymentConfig memory) {
        return DeploymentConfig({
            govTokenName: "Aetherium Governance",
            govTokenSymbol: "GOV",
            govTokenSupply: 1000000 * 10**18, // 1M tokens
            utilityTokenName: "Aetherium Play",
            utilityTokenSymbol: "PLAY",
            utilityTokenSupply: 0, // Minted through gameplay
            assetNFTName: "Aetherium Assets",
            assetNFTSymbol: "ASSET",
            resourceNFTURI: "https://api.aetheriumprime.com/metadata/resources/",
            marketplaceFee: 250 // 2.5%
        });
    }

    function deployAllContracts(
        DeploymentConfig memory config,
        address deployer
    ) internal returns (DeployedContracts memory contracts) {
        
        // Deploy Governance Token
        console.log("Deploying Governance Token...");
        GovernanceToken govTokenImpl = new GovernanceToken();
        bytes memory govTokenInitData = abi.encodeWithSelector(
            GovernanceToken.initialize.selector,
            deployer,
            config.govTokenName,
            config.govTokenSymbol,
            config.govTokenSupply
        );
        ERC1967Proxy govTokenProxy = new ERC1967Proxy(address(govTokenImpl), govTokenInitData);
        contracts.governanceToken = address(govTokenProxy);

        // Deploy Utility Token
        console.log("Deploying Utility Token...");
        UtilityToken utilityTokenImpl = new UtilityToken();
        bytes memory utilityTokenInitData = abi.encodeWithSelector(
            UtilityToken.initialize.selector,
            deployer,
            config.utilityTokenName,
            config.utilityTokenSymbol,
            config.utilityTokenSupply
        );
        ERC1967Proxy utilityTokenProxy = new ERC1967Proxy(address(utilityTokenImpl), utilityTokenInitData);
        contracts.utilityToken = address(utilityTokenProxy);

        // Deploy Game Asset NFT
        console.log("Deploying Game Asset NFT...");
        GameAssetNFT assetNFTImpl = new GameAssetNFT();
        bytes memory assetNFTInitData = abi.encodeWithSelector(
            GameAssetNFT.initialize.selector,
            deployer,
            config.assetNFTName,
            config.assetNFTSymbol
        );
        ERC1967Proxy assetNFTProxy = new ERC1967Proxy(address(assetNFTImpl), assetNFTInitData);
        contracts.gameAssetNFT = address(assetNFTProxy);

        // Deploy Game Resource NFT
        console.log("Deploying Game Resource NFT...");
        GameResourceNFT resourceNFTImpl = new GameResourceNFT();
        bytes memory resourceNFTInitData = abi.encodeWithSelector(
            GameResourceNFT.initialize.selector,
            deployer,
            config.resourceNFTURI
        );
        ERC1967Proxy resourceNFTProxy = new ERC1967Proxy(address(resourceNFTImpl), resourceNFTInitData);
        contracts.gameResourceNFT = address(resourceNFTProxy);

        // Deploy Game Logic
        console.log("Deploying Game Logic...");
        GameLogic gameLogicImpl = new GameLogic();
        bytes memory gameLogicInitData = abi.encodeWithSelector(
            GameLogic.initialize.selector,
            deployer,
            contracts.utilityToken,
            contracts.gameAssetNFT,
            contracts.gameResourceNFT
        );
        ERC1967Proxy gameLogicProxy = new ERC1967Proxy(address(gameLogicImpl), gameLogicInitData);
        contracts.gameLogic = address(gameLogicProxy);

        // Deploy Marketplace
        console.log("Deploying Marketplace...");
        Marketplace marketplaceImpl = new Marketplace();
        bytes memory marketplaceInitData = abi.encodeWithSelector(
            Marketplace.initialize.selector,
            deployer,
            config.marketplaceFee,
            deployer // Fee recipient
        );
        ERC1967Proxy marketplaceProxy = new ERC1967Proxy(address(marketplaceImpl), marketplaceInitData);
        contracts.marketplace = address(marketplaceProxy);

        // Deploy Staking Contract
        console.log("Deploying Staking Contract...");
        StakingContract stakingImpl = new StakingContract();
        bytes memory stakingInitData = abi.encodeWithSelector(
            StakingContract.initialize.selector,
            deployer,
            contracts.governanceToken,
            contracts.utilityToken,
            contracts.gameAssetNFT
        );
        ERC1967Proxy stakingProxy = new ERC1967Proxy(address(stakingImpl), stakingInitData);
        contracts.stakingContract = address(stakingProxy);

        return contracts;
    }

    function deployEnhancedContracts(
        DeployedContracts memory contracts,
        address deployer
    ) internal {
        console.log("\nDeploying Enhanced Contracts...");

        // Deploy Vesting
        console.log("Deploying Vesting...");
        Vesting vestingImpl = new Vesting();
        bytes memory vestingInitData = abi.encodeWithSelector(
            Vesting.initialize.selector,
            deployer,
            contracts.governanceToken
        );
        ERC1967Proxy vestingProxy = new ERC1967Proxy(address(vestingImpl), vestingInitData);
        contracts.vesting = address(vestingProxy);

        // Deploy Advanced Token Sinks
        console.log("Deploying Advanced Token Sinks...");
        AdvancedTokenSinks sinksImpl = new AdvancedTokenSinks();
        bytes memory sinksInitData = abi.encodeWithSelector(
            AdvancedTokenSinks.initialize.selector,
            deployer,
            contracts.utilityToken
        );
        ERC1967Proxy sinksProxy = new ERC1967Proxy(address(sinksImpl), sinksInitData);
        contracts.advancedTokenSinks = address(sinksProxy);

        // Deploy Dynamic Tokenomics
        console.log("Deploying Dynamic Tokenomics...");
        DynamicTokenomics tokenomicsImpl = new DynamicTokenomics();
        bytes memory tokenomicsInitData = abi.encodeWithSelector(
            DynamicTokenomics.initialize.selector,
            deployer,
            500, // 5% target inflation
            10000 * 10**18 // Max daily rewards
        );
        ERC1967Proxy tokenomicsProxy = new ERC1967Proxy(address(tokenomicsImpl), tokenomicsInitData);
        contracts.dynamicTokenomics = address(tokenomicsProxy);

        // Deploy Game Oracle
        console.log("Deploying Game Oracle...");
        GameOracle oracleImpl = new GameOracle();
        bytes memory oracleInitData = abi.encodeWithSelector(
            GameOracle.initialize.selector,
            deployer,
            2 // Require 2 confirmations
        );
        ERC1967Proxy oracleProxy = new ERC1967Proxy(address(oracleImpl), oracleInitData);
        contracts.gameOracle = address(oracleProxy);

        // Deploy Player Data Storage
        console.log("Deploying Player Data Storage...");
        PlayerDataStorage storageImpl = new PlayerDataStorage();
        bytes memory storageInitData = abi.encodeWithSelector(
            PlayerDataStorage.initialize.selector,
            deployer
        );
        ERC1967Proxy storageProxy = new ERC1967Proxy(address(storageImpl), storageInitData);
        contracts.playerDataStorage = address(storageProxy);

        // Deploy Signature Verifier (not upgradeable, regular contract)
        console.log("Deploying Signature Verifier...");
        contracts.signatureVerifier = address(new SignatureVerifier());

        console.log("Enhanced contracts deployed");
    }

    function setupInitialConfiguration(
        DeployedContracts memory contracts,
        address deployer
    ) internal {
        console.log("\nSetting up initial configuration...");

        // Grant roles to game logic contract
        UtilityToken utilityToken = UtilityToken(contracts.utilityToken);
        utilityToken.grantRole(utilityToken.MINTER_ROLE(), contracts.gameLogic);
        utilityToken.grantRole(utilityToken.BURNER_ROLE(), contracts.gameLogic);
        utilityToken.grantRole(utilityToken.GAME_ROLE(), contracts.gameLogic);

        // Grant roles to staking contract
        utilityToken.grantRole(utilityToken.MINTER_ROLE(), contracts.stakingContract);

        // Grant roles to advanced token sinks
        utilityToken.grantRole(utilityToken.MINTER_ROLE(), contracts.advancedTokenSinks);
        utilityToken.grantRole(utilityToken.BURNER_ROLE(), contracts.advancedTokenSinks);

        // Grant roles to game asset NFT
        GameAssetNFT gameAssetNFT = GameAssetNFT(contracts.gameAssetNFT);
        gameAssetNFT.grantRole(gameAssetNFT.MINTER_ROLE(), contracts.gameLogic);
        gameAssetNFT.grantRole(gameAssetNFT.GAME_ROLE(), contracts.gameLogic);
        gameAssetNFT.grantRole(gameAssetNFT.GAME_ROLE(), contracts.stakingContract);

        // Grant roles to game resource NFT
        GameResourceNFT gameResourceNFT = GameResourceNFT(contracts.gameResourceNFT);
        gameResourceNFT.grantRole(gameResourceNFT.MINTER_ROLE(), contracts.gameLogic);
        gameResourceNFT.grantRole(gameResourceNFT.GAME_ROLE(), contracts.gameLogic);

        // Create initial staking pools
        StakingContract stakingContract = StakingContract(contracts.stakingContract);
        
        // GOV token staking pool (30 days lock, 10% APY)
        stakingContract.createPool(
            StakingContract.PoolType.TOKEN_STAKING,
            contracts.governanceToken,
            317097919837645865, // ~10% APY in rewards per second
            30 days,
            0 // No max stake limit
        );

        // NFT staking pool (7 days lock, 5% APY equivalent)
        stakingContract.createPool(
            StakingContract.PoolType.NFT_STAKING,
            address(0), // Not used for NFT pools
            158548959918822932, // ~5% APY equivalent
            7 days,
            10 // Max 10 NFTs per user
        );

        // Setup vesting schedules for token distribution
        Vesting vesting = Vesting(contracts.vesting);
        
        // Fund vesting contract with governance tokens
        GovernanceToken govToken = GovernanceToken(contracts.governanceToken);
        govToken.transfer(address(vesting), 500000 * 10**18); // 50% of supply for vesting
        
        // Create vesting schedules for different allocations
        // Team allocation (20% of total supply)
        vesting.createBatchVestingSchedules(
            new address[](1),
            new uint256[](1),
            90 days, // 3 month cliff
            365 days, // 1 year vesting
            "Team"
        );
        
        console.log("Initial configuration completed");
    }

    function logDeploymentAddresses(DeployedContracts memory contracts) internal view {
        console.log("\n=== DEPLOYMENT COMPLETED ===");
        console.log("=== Core Contracts ===");
        console.log("Governance Token:", contracts.governanceToken);
        console.log("Utility Token:", contracts.utilityToken);
        console.log("Game Asset NFT:", contracts.gameAssetNFT);
        console.log("Game Resource NFT:", contracts.gameResourceNFT);
        console.log("Game Logic:", contracts.gameLogic);
        console.log("Marketplace:", contracts.marketplace);
        console.log("Staking Contract:", contracts.stakingContract);
        console.log("\n=== Enhanced Contracts ===");
        console.log("Vesting:", contracts.vesting);
        console.log("Advanced Token Sinks:", contracts.advancedTokenSinks);
        console.log("Dynamic Tokenomics:", contracts.dynamicTokenomics);
        console.log("Game Oracle:", contracts.gameOracle);
        console.log("Player Data Storage:", contracts.playerDataStorage);
        console.log("Signature Verifier:", contracts.signatureVerifier);
        console.log("===============================\n");
    }
}

