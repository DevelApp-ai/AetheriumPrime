/**
 * @package @lithosprotocol/web3-sdk
 * @description ABI for GameLogic contract
 */

export const GameLogicABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "DailyRewardClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "questId",
        "type": "uint256"
      }
    ],
    "name": "QuestCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "QuestStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "EIP712DomainChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "version",
        "type": "uint8"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "recipeId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "cost",
        "type": "uint256"
      }
    ],
    "name": "ItemCrafted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "PlayerRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_questId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_baseRewardAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_requiredLevel",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "_objectives",
        "type": "uint256[]"
      },
      {
        "internalType": "bool",
        "name": "_isActive",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_isDaily",
        "type": "bool"
      }
    ],
    "name": "addQuest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimDailyReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_recipeId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_useDynamicTokenomics",
        "type": "bool"
      }
    ],
    "name": "craftItem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDailyRewardAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLastDailyRewardClaimTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPlayerActiveQuests",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPlayerData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "level",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "experience",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "pvpWins",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "pvpLosses",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "pvpRating",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalDamageDealt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalDamageTaken",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "lastActivityTime",
            "type": "uint256"
          }
        ],
        "internalType": "struct IGameLogic.PlayerData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_questId",
        "type": "uint256"
      }
    ],
    "name": "getQuest",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "baseRewardAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredLevel",
            "type": "uint256"
          },
          {
            "internalType": "uint256[]",
            "name": "objectives",
            "type": "uint256[]"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isDaily",
            "type": "bool"
          }
        ],
        "internalType": "struct IGameLogic.Quest",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getQuestsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getQuestsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isPlayerRegistered",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "referrer",
        "type": "address"
      }
    ],
    "name": "registerPlayer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_questId",
        "type": "uint256"
      }
    ],
    "name": "startQuest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_questId",
        "type": "uint256"
      }
    ],
    "name": "completeQuest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_recipeId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_assetType",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_requiredLevel",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_baseCost",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "_resourceIds",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "_resourceAmounts",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "_successRate",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_isActive",
        "type": "bool"
      }
    ],
    "name": "addCraftingRecipe",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_recipeId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_targetAssetType",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_fromRarity",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_toRarity",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_requiredLevel",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "_resourceIds",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "_resourceAmounts",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "_cost",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_isActive",
        "type": "bool"
      }
    ],
    "name": "addUpgradeRecipe",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_recipeId",
        "type": "uint256"
      }
    ],
    "name": "getCraftingRecipe",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "assetType",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredLevel",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "baseCost",
            "type": "uint256"
          },
          {
            "internalType": "uint256[]",
            "name": "resourceIds",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256[]",
            "name": "resourceAmounts",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "successRate",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct IGameLogic.CraftingRecipe",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCraftingRecipesCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_recipeId",
        "type": "uint256"
      }
    ],
    "name": "getUpgradeRecipe",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "targetAssetType",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "fromRarity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "toRarity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredLevel",
            "type": "uint256"
          },
          {
            "internalType": "uint256[]",
            "name": "resourceIds",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256[]",
            "name": "resourceAmounts",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "cost",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct IGameLogic.UpgradeRecipe",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getUpgradeRecipesCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_tokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_recipeId",
        "type": "uint256"
      }
    ],
    "name": "upgradeAsset",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      }
    ],
    "name": "getRoleAdmin",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "hasRole",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "callerConfirmation",
        "type": "address"
      }
    ],
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default GameLogicABI;
