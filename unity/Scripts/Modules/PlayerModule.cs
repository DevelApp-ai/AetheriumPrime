using System;
using System.Numerics;
using System.Threading.Tasks;
using UnityEngine;

namespace LithosProtocol.Unity.Modules
{
    /// <summary>
    /// Player Module - Handles player registration and data operations
    /// </summary>
    public class PlayerModule : BaseModule
    {
        public PlayerModule(LithosProtocolUnity sdk) : base(sdk) { }
        
        /// <summary>
        /// Register a new player
        /// </summary>
        /// <param name="referrer">Address of the referrer (optional)</param>
        /// <returns>Transaction hash</returns>
        public async Task<string> RegisterPlayer(string referrer = null)
        {
            await EnsureConnected();
            string address = await GetConnectedAddress();
            
            Log($"Registering player: {address}");
            
            // Use GameLogicV2 if available, otherwise GameLogic
            string contractAddress = !string.IsNullOrEmpty(Sdk.ContractAddresses.GameLogicV2) 
                ? Sdk.ContractAddresses.GameLogicV2 
                : Sdk.ContractAddresses.GameLogic;
            
            if (string.IsNullOrEmpty(contractAddress))
            {
                throw new ContractNotFoundException("GameLogic");
            }
            
            // Call the contract
            string txHash = await Sdk.CallContract(
                contractAddress,
                "registerPlayer",
                referrer ?? "0x0000000000000000000000000000000000000000"
            );
            
            Log($"Player registration transaction: {txHash}");
            return txHash;
        }
        
        /// <summary>
        /// Get player data
        /// </summary>
        /// <param name="address">Address of the player (optional, defaults to connected address)</param>
        /// <returns>Player data</returns>
        public async Task<PlayerData> GetPlayerData(string address = null)
        {
            await EnsureConnected();
            string targetAddress = address ?? await GetConnectedAddress();
            
            Log($"Getting player data for: {targetAddress}");
            
            // Use GameLogicV2 if available
            string contractAddress = !string.IsNullOrEmpty(Sdk.ContractAddresses.GameLogicV2) 
                ? Sdk.ContractAddresses.GameLogicV2 
                : Sdk.ContractAddresses.GameLogic;
            
            if (string.IsNullOrEmpty(contractAddress))
            {
                throw new ContractNotFoundException("GameLogic");
            }
            
            // Call the contract
            var result = await Sdk.CallContract(
                contractAddress,
                "getPlayerData",
                targetAddress
            );
            
            // Parse result (simplified - in reality would use ABI decoding)
            // For now, return a placeholder
            return new PlayerData
            {
                Address = targetAddress,
                Level = 1,
                Experience = BigInteger.Zero,
                PvpWins = BigInteger.Zero,
                PvpLosses = BigInteger.Zero,
                PvpRating = BigInteger.Zero,
                TotalDamageDealt = BigInteger.Zero,
                TotalDamageTaken = BigInteger.Zero,
                IsActive = true,
                LastActivityTime = BigInteger.Zero
            };
        }
        
        /// <summary>
        /// Get player stats
        /// </summary>
        /// <param name="address">Address of the player (optional)</param>
        /// <returns>Player stats</returns>
        public async Task<PlayerStats> GetPlayerStats(string address = null)
        {
            await EnsureConnected();
            string targetAddress = address ?? await GetConnectedAddress();
            
            Log($"Getting player stats for: {targetAddress}");
            
            // Use PlayerDataStorage if available
            string contractAddress = Sdk.ContractAddresses.PlayerDataStorage;
            
            if (string.IsNullOrEmpty(contractAddress))
            {
                throw new ContractNotFoundException("PlayerDataStorage");
            }
            
            // Call the contract
            var result = await Sdk.CallContract(
                contractAddress,
                "getPlayerStats",
                targetAddress
            );
            
            // Parse result
            return new PlayerStats
            {
                TotalQuestsCompleted = BigInteger.Zero,
                TotalCrafted = BigInteger.Zero,
                TotalItemsCrafted = BigInteger.Zero,
                LongestWinStreak = BigInteger.Zero,
                CurrentWinStreak = BigInteger.Zero
            };
        }
        
        /// <summary>
        /// Check if player is registered
        /// </summary>
        /// <param name="address">Address of the player (optional)</param>
        /// <returns>True if player is registered</returns>
        public async Task<bool> IsPlayerRegistered(string address = null)
        {
            await EnsureConnected();
            string targetAddress = address ?? await GetConnectedAddress();
            
            // Use GameLogicV2 if available
            string contractAddress = !string.IsNullOrEmpty(Sdk.ContractAddresses.GameLogicV2) 
                ? Sdk.ContractAddresses.GameLogicV2 
                : Sdk.ContractAddresses.GameLogic;
            
            if (string.IsNullOrEmpty(contractAddress))
            {
                throw new ContractNotFoundException("GameLogic");
            }
            
            var result = await Sdk.CallContract(
                contractAddress,
                "isPlayerRegistered",
                targetAddress
            );
            
            // Parse boolean result
            return result == "true" || result == "1" || result == "True";
        }
        
        /// <summary>
        /// Get player balance (tokens and NFTs)
        /// </summary>
        /// <param name="address">Address of the player (optional)</param>
        /// <returns>Player balance including tokens and NFTs</returns>
        public async Task<PlayerBalance> GetPlayerBalance(string address = null)
        {
            await EnsureConnected();
            string targetAddress = address ?? await GetConnectedAddress();
            
            Log($"Getting player balance for: {targetAddress}");
            
            // Get token balances
            var tokenBalance = await Sdk.Token.GetTokenBalances(targetAddress);
            
            // Get assets and resources
            var assets = await Sdk.NFT.GetPlayerAssets(targetAddress);
            var resources = await Sdk.NFT.GetPlayerResources(targetAddress);
            
            return new PlayerBalance
            {
                Tokens = tokenBalance,
                Assets = assets,
                Resources = resources
            };
        }
        
        /// <summary>
        /// Claim daily reward
        /// </summary>
        /// <returns>Transaction hash</returns>
        public async Task<string> ClaimDailyReward()
        {
            await EnsureConnected();
            
            Log("Claiming daily reward");
            
            // Use GameLogicV2 if available
            string contractAddress = !string.IsNullOrEmpty(Sdk.ContractAddresses.GameLogicV2) 
                ? Sdk.ContractAddresses.GameLogicV2 
                : Sdk.ContractAddresses.GameLogic;
            
            if (string.IsNullOrEmpty(contractAddress))
            {
                throw new ContractNotFoundException("GameLogic");
            }
            
            // Call the contract
            string txHash = await Sdk.CallContract(
                contractAddress,
                "claimDailyReward"
            );
            
            Log($"Daily reward claim transaction: {txHash}");
            return txHash;
        }
        
        /// <summary>
        /// Get daily reward amount
        /// </summary>
        /// <returns>Reward amount in wei</returns>
        public async Task<BigInteger> GetDailyRewardAmount()
        {
            await EnsureConnected();
            
            // Use GameLogicV2 if available
            string contractAddress = !string.IsNullOrEmpty(Sdk.ContractAddresses.GameLogicV2) 
                ? Sdk.ContractAddresses.GameLogicV2 
                : Sdk.ContractAddresses.GameLogic;
            
            if (string.IsNullOrEmpty(contractAddress))
            {
                throw new ContractNotFoundException("GameLogic");
            }
            
            var result = await Sdk.CallContract(
                contractAddress,
                "getDailyRewardAmount"
            );
            
            // Parse result
            if (BigInteger.TryParse(result, out BigInteger amount))
            {
                return amount;
            }
            
            return BigInteger.Zero;
        }
        
        /// <summary>
        /// Get the last time daily reward was claimed
        /// </summary>
        /// <returns>Timestamp of last claim</returns>
        public async Task<BigInteger> GetLastDailyRewardClaimTime()
        {
            await EnsureConnected();
            
            // Use GameLogicV2 if available
            string contractAddress = !string.IsNullOrEmpty(Sdk.ContractAddresses.GameLogicV2) 
                ? Sdk.ContractAddresses.GameLogicV2 
                : Sdk.ContractAddresses.GameLogic;
            
            if (string.IsNullOrEmpty(contractAddress))
            {
                throw new ContractNotFoundException("GameLogic");
            }
            
            var result = await Sdk.CallContract(
                contractAddress,
                "getLastDailyRewardClaimTime"
            );
            
            // Parse result
            if (BigInteger.TryParse(result, out BigInteger timestamp))
            {
                return timestamp;
            }
            
            return BigInteger.Zero;
        }
    }
    
    /// <summary>
    /// Player data model
    /// </summary>
    [Serializable]
    public class PlayerData
    {
        public string Address;
        public int Level;
        public BigInteger Experience;
        public BigInteger PvpWins;
        public BigInteger PvpLosses;
        public BigInteger PvpRating;
        public BigInteger TotalDamageDealt;
        public BigInteger TotalDamageTaken;
        public bool IsActive;
        public BigInteger LastActivityTime;
    }
    
    /// <summary>
    /// Player stats model
    /// </summary>
    [Serializable]
    public class PlayerStats
    {
        public BigInteger TotalQuestsCompleted;
        public BigInteger TotalCrafted;
        public BigInteger TotalItemsCrafted;
        public BigInteger LongestWinStreak;
        public BigInteger CurrentWinStreak;
    }
    
    /// <summary>
    /// Player balance model
    /// </summary>
    [Serializable]
    public class PlayerBalance
    {
        public TokenBalance Tokens;
        public NFTAsset[] Assets;
        public NFTResource[] Resources;
    }
}
