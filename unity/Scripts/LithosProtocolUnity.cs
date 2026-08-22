using System;
using System.Collections.Generic;
using System.Numerics;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Events;

namespace LithosProtocol.Unity
{
    /// <summary>
    /// Main Unity SDK class for LithosProtocol
    /// Provides easy integration with LithosProtocol smart contracts
    /// </summary>
    public class LithosProtocolUnity : MonoBehaviour
    {
        [Header("Configuration")]
        [Tooltip("Network to connect to")]
        public Network Network = Network.Sepolia;
        
        [Tooltip("Custom RPC URL (overrides network selection)")]
        public string CustomRpcUrl = "";
        
        [Tooltip("Enable debug logging")]
        public bool DebugMode = false;
        
        [Header("Contract Addresses")]
        public ContractAddresses ContractAddresses = new ContractAddresses();
        
        [Header("Events")]
        public UnityEvent<string> OnConnected = new UnityEvent<string>();
        public UnityEvent<string> OnDisconnected = new UnityEvent<string>();
        public UnityEvent<string> OnError = new UnityEvent<string>();
        
        // Internal state
        private ILithosProvider _provider;
        private string _connectedAddress;
        private bool _isInitialized = false;
        
        // Modules (lazy initialized)
        private PlayerModule _playerModule;
        private TokenModule _tokenModule;
        private NFTModule _nftModule;
        private GameModule _gameModule;
        private MarketplaceModule _marketplaceModule;
        private StakingModule _stakingModule;
        private VestingModule _vestingModule;
        
        // Module properties
        public PlayerModule Player => _playerModule ??= new PlayerModule(this);
        public TokenModule Token => _tokenModule ??= new TokenModule(this);
        public NFTModule NFT => _nftModule ??= new NFTModule(this);
        public GameModule Game => _gameModule ??= new GameModule(this);
        public MarketplaceModule Marketplace => _marketplaceModule ??= new MarketplaceModule(this);
        public StakingModule Staking => _stakingModule ??= new StakingModule(this);
        public VestingModule Vesting => _vestingModule ??= new VestingModule(this);
        
        // Properties
        public bool IsConnected => _connectedAddress != null;
        public string ConnectedAddress => _connectedAddress;
        public bool IsInitialized => _isInitialized;
        
        /// <summary>
        /// Initialize the SDK
        /// </summary>
        public async Task Initialize()
        {
            await Initialize(null);
        }
        
        /// <summary>
        /// Initialize the SDK with custom configuration
        /// </summary>
        public async Task Initialize(LithosConfig config)
        {
            if (_isInitialized)
            {
                Log("SDK already initialized");
                return;
            }
            
            try
            {
                // Use provided config or create from inspector values
                var effectiveConfig = config ?? CreateConfigFromInspector();
                
                // Create provider based on platform
                _provider = CreateProvider(effectiveConfig);
                
                // Initialize modules
                _playerModule = new PlayerModule(this);
                _tokenModule = new TokenModule(this);
                _nftModule = new NFTModule(this);
                _gameModule = new GameModule(this);
                _marketplaceModule = new MarketplaceModule(this);
                _stakingModule = new StakingModule(this);
                _vestingModule = new VestingModule(this);
                
                // Initialize modules
                await _playerModule.Initialize();
                await _tokenModule.Initialize();
                await _nftModule.Initialize();
                await _gameModule.Initialize();
                await _marketplaceModule.Initialize();
                await _stakingModule.Initialize();
                await _vestingModule.Initialize();
                
                _isInitialized = true;
                Log("SDK initialized successfully");
            }
            catch (Exception ex)
            {
                LogError($