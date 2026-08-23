/**
 * @package @lithosprotocol/web3-sdk
 * @description Contract abstraction layer for LithosProtocol
 */

import { ethers, Contract, Signer, Provider } from 'ethers';
import {
  LithosProtocolSDK,
  ContractAddresses,
  NotConnectedError,
  ContractNotFoundError
} from '../LithosProtocolSDK';
import * as ABIs from './abis';

// ========== CONTRACT FACTORY ==========

/**
 * Contract factory for creating contract instances
 */
export class ContractFactory {
  private sdk: LithosProtocolSDK;
  
  constructor(sdk: LithosProtocolSDK) {
    this.sdk = sdk;
  }

  /**
   * Get a contract instance by name
   */
  getContract(contractName: string): Contract {
    return this.sdk.getContract(contractName);
  }

  /**
   * Create a contract instance with custom address
   */
  createContract(contractName: string, address: string, signerOrProvider?: Signer | Provider): Contract {
    const abi = (ABIs as any)[`${contractName}ABI`] || [];
    if (!abi.length) {
      throw new ContractNotFoundError(contractName);
    }
    
    const provider = signerOrProvider || this.sdk.provider;
    if (!provider) {
      throw new NotConnectedError();
    }
    
    return new Contract(address, abi, signerOrProvider);
  }

  /**
   * Get all contract instances
   */
  getAllContracts(): Record<string, Contract> {
    const contracts: Record<string, Contract> = {};
    const contractNames = [
      'governanceToken',
      'utilityToken',
      'gameAssetNFT',
      'gameResourceNFT',
      'gameLogic',
      'gameLogicV2',
      'marketplace',
      'marketplaceV2',
      'stakingContract',
      'vesting',
      'advancedTokenSinks',
      'dynamicTokenomics',
      'gameOracle',
      'playerDataStorage',
      'signatureVerifier'
    ];
    
    for (const name of contractNames) {
      try {
        contracts[name] = this.getContract(name);
      } catch {
        // Skip contracts that don't have addresses
      }
    }
    
    return contracts;
  }
}

// ========== INDIVIDUAL CONTRACT WRAPPERS ==========

// These provide type-safe method calls for each contract

// Note: Full contract wrappers would be implemented for each contract
// For now, we expose the ContractFactory as the main interface

export { ABIs };
export default ContractFactory;
