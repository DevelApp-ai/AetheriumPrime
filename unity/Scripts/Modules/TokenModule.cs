using System;
using System.Numerics;
using System.Threading.Tasks;
using UnityEngine;

namespace LithosProtocol.Unity.Modules
{
    /// <summary>
    /// Token Module - Handles token operations (Governance and Utility tokens)
    /// </summary>
    public class TokenModule : BaseModule
    {
        public TokenModule(LithosProtocolUnity sdk) : base(sdk) { }
        
        /// <summary>
        /// Get governance token contract address
        /// </summary>
        public string GetGovernanceTokenAddress()
        {
            return Sdk.ContractAddresses.GovernanceToken;
        }
        
        /// <summary>
        /// Get utility token contract address
        /// </summary>
        public string GetUtilityTokenAddress()
        {
            return Sdk.ContractAddresses.UtilityToken;
        }
        
        /// <summary>
        /// Get token info
        /// </summary>
        /// <param name="tokenType">Type of token (Governance or Utility)</param>
        /// <returns>Token info</returns>
        public async Task<TokenInfo> GetTokenInfo(TokenType tokenType)
        {
            string contractAddress = tokenType == TokenType.Governance 
                ? Sdk.ContractAddresses.GovernanceToken 
                : Sdk.ContractAddresses.UtilityToken;
            
            if (string.IsNullOrEmpty(contractAddress))
            {
                throw new ContractNotFoundException(tokenType.ToString());
            }
            
            Log($"Getting {tokenType} token info from: {contractAddress}");
            
            // Call contract methods
            var nameTask = Sdk.CallContract(contractAddress, "name");
            var symbolTask = Sdk.CallContract(contractAddress, "symbol");
            var decimalsTask = Sdk.CallContract(contractAddress, "decimals");
            var totalSupplyTask = Sdk.CallContract(contractAddress, "totalSupply");
            
            await Task.WhenAll(nameTask, symbolTask, decimalsTask, totalSupplyTask);
            
            return new TokenInfo
            {
                Name = await nameTask,
                Symbol = await symbolTask,
                Decimals = int.Parse(await decimalsTask),
                TotalSupply = BigInteger.Parse((await totalSupplyTask).Replace("\"", "")),
                Address = contractAddress
            };
        }
        
        /// <summary>
        /// Get token balance for an address
        /// </summary>
        /// <param name="tokenType">Type of token</param>
        /// <param name="address">Address to check (optional, defaults to connected address)</param>
        /// <returns>Token balance in wei</returns>
        public async Task<BigInteger> GetBalance(TokenType tokenType, string address = null)
        {
            await EnsureConnected();
            string targetAddress = address ?? await GetConnectedAddress();
            
            string contractAddress = tokenType == TokenType.Governance 
                ? Sdk.ContractAddresses.GovernanceToken 
                : Sdk.ContractAddresses.UtilityToken;
            
            if (string.IsNullOrEmpty(contractAddress))
            {
                throw new ContractNotFoundException(tokenType.ToString());
            }
            
            Log($"Getting {tokenType} balance for: {targetAddress}");
            
            var result = await Sdk.CallContract(
                contractAddress,
                "balanceOf",
                targetAddress
            );
            
            // Parse result
            if (BigInteger.TryParse(result, out BigInteger balance))
            {
                return balance;
            }
            
            return BigInteger.Zero;
        }
        
        /// <summary>
        /// Get token balances for both tokens
        /// </summary>
        /// <param name="address">Address to check (optional)</param>
        /// <returns>Token balances for both tokens</returns>
        public async Task<TokenBalance> GetTokenBalances(string address = null)
        {
            await EnsureConnected();
            string targetAddress = address ?? await GetConnectedAddress();
            
            var governanceTask = GetBalance(TokenType.Governance, targetAddress);
            var utilityTask = GetBalance(TokenType.Utility, targetAddress);
            
            await Task.WhenAll(governanceTask, utilityTask);
            
            return new TokenBalance
            {
                GovernanceToken = await governanceTask,
                UtilityToken = await utilityTask
            };
        }
        
        /// <summary>
        /// Transfer tokens
        /// </summary>
        /// <param name="tokenType">Type of token</param>
        /// <param name="to">Recipient address</param>
        /// <param name="amount">Amount to transfer (in wei)</param>
        /// <returns>Transaction hash</returns>
        public async Task<string> Transfer(TokenType tokenType, string to, BigInteger amount)
        {
            await EnsureConnected();
            
            if (!LithosProtocolUnity.IsValidAddress(to))
            {
                throw new ArgumentException("Invalid recipient address", nameof(to));
            }
            
            string contractAddress = tokenType == TokenType.Governance 
                ? Sdk.ContractAddresses.GovernanceToken 
                : Sdk.ContractAddresses.UtilityToken;
            
            if (string.IsNullOrEmpty(contractAddress))
            {
                throw new ContractNotFoundException(tokenType.ToString());
            }
            
            Log($"Transferring {amount} {tokenType} to: {to}");
            
            // Check balance
            var balance = await GetBalance(tokenType);
            if (balance < amount)
            {
                throw new InsufficientBalanceException(
                    tokenType.ToString(),
                    amount,
                    balance
                );
            }
            
            // Call the contract
            string txHash = await Sdk.CallContract(
                contractAddress,
                "transfer",
                to,
                amount.ToString()
            );
            
            Log($"Transfer transaction: {txHash}");
            return txHash;
        }
        
        /// <summary>
        /// Approve token spending
        /// </summary>
        /// <param name="tokenType">Type of token</param>
        /// <param name="spender">Address allowed to spend tokens</param>
        /// <param name="amount">Amount to approve (in wei, use MaxUInt256 for unlimited)</param>
        /// <returns>Transaction hash</returns>
        public async Task<string> Approve(TokenType tokenType, string spender, BigInteger amount)
        {
            await EnsureConnected();
            
            if (!LithosProtocolUnity.IsValidAddress(spender))
            {
                throw new ArgumentException("Invalid spender address", nameof(spender));
            }
            
            string contractAddress = tokenType == TokenType.Governance 
                ? Sdk.ContractAddresses.GovernanceToken 
                : Sdk.ContractAddresses.UtilityToken;
            
            if (string.IsNullOrEmpty(contractAddress))
            {
                throw new ContractNotFoundException(tokenType.ToString());
            }
            
            Log($"Approving {amount} {tokenType} for: {spender}");
            
            // Call the contract
            string txHash = await Sdk.CallContract(
                contractAddress,
                "approve",
                spender,
                amount.ToString()
            );
            
            Log($"Approval transaction: {txHash}");
            return txHash;
        }
        
        /// <summary>
        /// Get allowance
        /// </summary>
        /// <param name="tokenType">Type of token</param>
        /// <param name="owner">Owner address</param>
        /// <param name="spender">Spender address</param>
        /// <returns>Allowed amount (in wei)</returns>
        public async Task<BigInteger> GetAllowance(TokenType tokenType, string owner, string spender)
        {
            string contractAddress = tokenType == TokenType.Governance 
                ? Sdk.ContractAddresses.GovernanceToken 
                : Sdk.ContractAddresses.UtilityToken;
            
            if (string.IsNullOrEmpty(contractAddress))
            {
                throw new ContractNotFoundException(tokenType.ToString());
            }
            
            var result = await Sdk.CallContract(
                contractAddress,
                "allowance",
                owner,
                spender
            );
            
            // Parse result
            if (BigInteger.TryParse(result, out BigInteger allowance))
            {
                return allowance;
            }
            
            return BigInteger.Zero;
        }
        
        /// <summary>
        /// Check if approval is needed for a spender
        /// </summary>
        /// <param name="tokenType">Type of token</param>
        /// <param name="spender">Spender address</param>
        /// <param name="amount">Amount needed</param>
        /// <returns>True if approval is needed</returns>
        public async Task<bool> NeedsApproval(TokenType tokenType, string spender, BigInteger amount)
        {
            await EnsureConnected();
            string address = await GetConnectedAddress();
            
            var allowance = await GetAllowance(tokenType, address, spender);
            return allowance < amount;
        }
        
        /// <summary>
        /// Approve unlimited spending
        /// </summary>
        /// <param name="tokenType">Type of token</param>
        /// <param name="spender">Address allowed to spend tokens</param>
        /// <returns>Transaction hash</returns>
        public async Task<string> ApproveUnlimited(TokenType tokenType, string spender)
        {
            // Max UInt256: 115792089237316195423570985008687907853269984665640564039457584007913129639935
            BigInteger maxUint256 = BigInteger.Parse("115792089237316195423570985008687907853269984665640564039457584007913129639935");
            return await Approve(tokenType, spender, maxUint256);
        }
        
        /// <summary>
        /// Burn tokens
        /// </summary>
        /// <param name="tokenType">Type of token</param>
        /// <param name="amount">Amount to burn (in wei)</param>
        /// <returns>Transaction hash</returns>
        public async Task<string> Burn(TokenType tokenType, BigInteger amount)
        {
            await EnsureConnected();
            
            string contractAddress = tokenType == TokenType.Governance 
                ? Sdk.ContractAddresses.GovernanceToken 
                : Sdk.ContractAddresses.UtilityToken;
            
            if (string.IsNullOrEmpty(contractAddress))
            {
                throw new ContractNotFoundException(tokenType.ToString());
            }
            
            Log($"Burning {amount} {tokenType}");
            
            // Call the contract
            string txHash = await Sdk.CallContract(
                contractAddress,
                "burn",
                amount.ToString()
            );
            
            Log($"Burn transaction: {txHash}");
            return txHash;
        }
        
        /// <summary>
        /// Format token amount for display
        /// </summary>
        /// <param name="amount">Amount in wei</param>
        /// <param name="tokenType">Type of token</param>
        /// <returns>Formatted amount</returns>
        public async Task<string> FormatAmount(BigInteger amount, TokenType tokenType)
        {
            var tokenInfo = await GetTokenInfo(tokenType);
            decimal decimals = Math.Pow(10, tokenInfo.Decimals);
            decimal formatted = (decimal)amount / decimals;
            return formatted.ToString();
        }
        
        /// <summary>
        /// Parse formatted amount to wei
        /// </summary>
        /// <param name="amount">Formatted amount</param>
        /// <param name="tokenType">Type of token</param>
        /// <returns>Amount in wei</returns>
        public async Task<BigInteger> ParseAmount(string amount, TokenType tokenType)
        {
            var tokenInfo = await GetTokenInfo(tokenType);
            decimal decimals = Math.Pow(10, tokenInfo.Decimals);
            
            if (decimal.TryParse(amount, out decimal parsedAmount))
            {
                return BigInteger.Parse((parsedAmount * decimals).ToString("F0"));
            }
            
            return BigInteger.Zero;
        }
    }
    
    /// <summary>
    /// Token info model
    /// </summary>
    [Serializable]
    public class TokenInfo
    {
        public string Name;
        public string Symbol;
        public int Decimals;
        public BigInteger TotalSupply;
        public string Address;
    }
    
    /// <summary>
    /// Token balance model
    /// </summary>
    [Serializable]
    public class TokenBalance
    {
        public BigInteger GovernanceToken;
        public BigInteger UtilityToken;
    }
}
