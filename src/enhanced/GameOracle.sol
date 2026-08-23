// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2Upgradeable.sol";

/// @title GameOracle
/// @notice Contract for integrating with Chainlink oracles for game data
/// @dev Provides random number generation, price feeds, and external data for game mechanics
/// @author LithosProtocol Team
contract GameOracle is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    VRFConsumerBaseV2Upgradeable
{
    using SafeERC20 for IERC20Upgradeable;

    // Chainlink VRF configuration
    address internal s_linkAddress;
    bytes32 internal s_linkKeyHash;
    uint256 internal s_fee;

    // Chainlink Price Feed addresses
    mapping(string => address) public priceFeeds;

    // Request tracking
    mapping(bytes32 => bool) public requestExists;
    mapping(bytes32 => uint256) public randomNumbers;
    mapping(bytes32 => uint256) public requestTimestamps;

    // Game configuration
    struct GameConfig {
        uint256 minRandomNumber;
        uint256 maxRandomNumber;
        uint256 requestTimeout;
        uint256 callbackGasLimit;
    }

    GameConfig public gameConfig;

    // Events
    event OracleInitialized(
        address linkAddress,
        bytes32 keyHash,
        uint256 fee
    );
    event PriceFeedAdded(string indexed symbol, address feedAddress);
    event PriceFeedUpdated(string indexed symbol, address feedAddress);
    event RandomNumberRequested(
        bytes32 indexed requestId,
        address indexed requester
    );
    event RandomNumberReceived(
        bytes32 indexed requestId,
        uint256 indexed randomNumber,
        address indexed requester
    );
    event RandomNumberTimeout(bytes32 indexed requestId);
    event GameConfigUpdated(
        uint256 minRandomNumber,
        uint256 maxRandomNumber,
        uint256 requestTimeout,
        uint256 callbackGasLimit
    );

    // Modifiers
    modifier onlyWhenNotPaused() {
        _requireNotPaused();
        _;
    }

    // ====================== INITIALIZATION ======================

    /// @custom:oz-upgradeable
    function initialize(
        address _linkAddress,
        bytes32 _keyHash,
        uint256 _fee,
        uint256 _minRandom,
        uint256 _maxRandom,
        uint256 _timeout,
        uint256 _callbackGasLimit
    ) external initializer {
        __AccessControlUpgradeable_init();
        __PausableUpgradeable_init();
        __ReentrancyGuardUpgradeable_init();
        __UUPSUpgradeable_init();

        s_linkAddress = _linkAddress;
        s_linkKeyHash = _keyHash;
        s_fee = _fee;

        gameConfig = GameConfig({
            minRandomNumber: _minRandom,
            maxRandomNumber: _maxRandom,
            requestTimeout: _timeout,
            callbackGasLimit: _callbackGasLimit
        });

        emit OracleInitialized(_linkAddress, _keyHash, _fee);
        emit GameConfigUpdated(
            _minRandom,
            _maxRandom,
            _timeout,
            _callbackGasLimit
        );
    }

    // ====================== OWNER FUNCTIONS ======================

    /// @notice Set Chainlink configuration
    /// @param _linkAddress Address of LINK token
    /// @param _keyHash Key hash for VRF
    /// @param _fee Fee for VRF requests
    function setChainlinkConfig(
        address _linkAddress,
        bytes32 _keyHash,
        uint256 _fee
    ) external onlyOwner onlyWhenNotPaused {
        s_linkAddress = _linkAddress;
        s_linkKeyHash = _keyHash;
        s_fee = _fee;
        emit OracleInitialized(_linkAddress, _keyHash, _fee);
    }

    /// @notice Add a price feed
    /// @param symbol The symbol of the asset (e.g., "ETH", "BTC", "GOV")
    /// @param feedAddress The address of the Chainlink price feed
    function addPriceFeed(
        string memory symbol,
        address feedAddress
    ) external onlyOwner onlyWhenNotPaused {
        require(
            feedAddress != address(0),
            "Price feed address cannot be zero"
        );
        require(
            bytes(symbol).length > 0,
            "Symbol cannot be empty"
        );
        priceFeeds[symbol] = feedAddress;
        emit PriceFeedAdded(symbol, feedAddress);
    }

    /// @notice Update a price feed
    /// @param symbol The symbol of the asset
    /// @param feedAddress The new address of the Chainlink price feed
    function updatePriceFeed(
        string memory symbol,
        address feedAddress
    ) external onlyOwner onlyWhenNotPaused {
        require(
            feedAddress != address(0),
            "Price feed address cannot be zero"
        );
        require(
            priceFeeds[symbol] != address(0),
            "Price feed does not exist"
        );
        priceFeeds[symbol] = feedAddress;
        emit PriceFeedUpdated(symbol, feedAddress);
    }

    /// @notice Update game configuration
    /// @param _minRandom Minimum random number
    /// @param _maxRandom Maximum random number
    /// @param _timeout Request timeout in seconds
    /// @param _callbackGasLimit Callback gas limit
    function updateGameConfig(
        uint256 _minRandom,
        uint256 _maxRandom,
        uint256 _timeout,
        uint256 _callbackGasLimit
    ) external onlyOwner onlyWhenNotPaused {
        gameConfig.minRandomNumber = _minRandom;
        gameConfig.maxRandomNumber = _maxRandom;
        gameConfig.requestTimeout = _timeout;
        gameConfig.callbackGasLimit = _callbackGasLimit;
        emit GameConfigUpdated(
            _minRandom,
            _maxRandom,
            _timeout,
            _callbackGasLimit
        );
    }

    // ====================== PRICE FEED FUNCTIONS ======================

    /// @notice Get the latest price for a token
    /// @param symbol The symbol of the asset
    /// @return The latest price with 8 decimals (e.g., ETH/USD = 200000000000 for $2000)
    function getLatestPrice(
        string memory symbol
    ) external view onlyWhenNotPaused returns (int256) {
        address feedAddress = priceFeeds[symbol];
        require(
            feedAddress != address(0),
            "Price feed not configured for this symbol"
        );

        AggregatorV3Interface feed = AggregatorV3Interface(feedAddress);
        (
            uint80 roundID,
            int256 price,
            ,
            uint256 updatedAt,
            
        ) = feed.latestRoundData();

        // Check if price is stale (older than 1 hour)
        require(
            block.timestamp - updatedAt <= 3600,
            "Price feed data is stale"
        );

        return price;
    }

    /// @notice Get the latest price for multiple tokens
    /// @param symbols Array of token symbols
    /// @return Array of latest prices
    function getLatestPrices(
        string[] memory symbols
    ) external view onlyWhenNotPaused returns (int256[] memory) {
        int256[] memory prices = new int256[](symbols.length);
        for (uint256 i = 0; i < symbols.length; i++) {
            prices[i] = getLatestPrice(symbols[i]);
        }
        return prices;
    }

    /// @notice Get the price feed address for a symbol
    /// @param symbol The symbol of the asset
    /// @return The address of the price feed
    function getPriceFeedAddress(
        string memory symbol
    ) external view onlyWhenNotPaused returns (address) {
        return priceFeeds[symbol];
    }

    // ====================== RANDOM NUMBER FUNCTIONS ======================

    /// @notice Request a random number
    /// @dev Uses Chainlink VRF v2
    /// @param userSeed Optional user-provided seed for additional randomness
    /// @return The request ID
    function requestRandomNumber(
        bytes32 userSeed
    ) external onlyWhenNotPaused nonReentrant returns (bytes32) {
        require(
            LINK.balanceOf(address(this)) > s_fee,
            "Not enough LINK for VRF request"
        );

        bytes32 requestId = requestRandomness(
            s_linkKeyHash,
            s_fee,
            gameConfig.callbackGasLimit,
            1,
            userSeed
        );

        requestExists[requestId] = true;
        requestTimestamps[requestId] = block.timestamp;

        emit RandomNumberRequested(requestId, msg.sender);

        return requestId;
    }

    /// @notice Request multiple random numbers
    /// @param count Number of random numbers to request
    /// @param userSeed Optional user-provided seed
    /// @return Array of request IDs
    function requestMultipleRandomNumbers(
        uint256 count,
        bytes32 userSeed
    ) external onlyWhenNotPaused nonReentrant returns (bytes32[] memory) {
        require(
            LINK.balanceOf(address(this)) > s_fee * count,
            "Not enough LINK for VRF requests"
        );

        bytes32[] memory requestIds = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            requestIds[i] = requestRandomNumber(userSeed);
        }
        return requestIds;
    }

    /// @notice Check if a random number is ready
    /// @param requestId The request ID
    /// @return Whether the random number is ready
    function isRandomNumberReady(
        bytes32 requestId
    ) external view onlyWhenNotPaused returns (bool) {
        return randomNumbers[requestId] != 0 ||
            block.timestamp > requestTimestamps[requestId] + gameConfig.requestTimeout;
    }

    /// @notice Get a random number
    /// @param requestId The request ID
    /// @return The random number
    function getRandomNumber(
        bytes32 requestId
    ) external view onlyWhenNotPaused returns (uint256) {
        require(
            requestExists[requestId],
            "Request does not exist"
        );
        require(
            randomNumbers[requestId] != 0 ||
                block.timestamp > requestTimestamps[requestId] + gameConfig.requestTimeout,
            "Random number not yet available"
        );

        // If timeout, return a deterministic fallback
        if (randomNumbers[requestId] == 0) {
            return uint256(
                keccak256(
                    abi.encodePacked(
                        requestId,
                        block.timestamp,
                        block.difficulty
                    )
                )
            ) % (gameConfig.maxRandomNumber - gameConfig.minRandomNumber + 1) +
            gameConfig.minRandomNumber;
        }

        return randomNumbers[requestId];
    }

    /// @notice Get a random number within a range
    /// @param requestId The request ID
    /// @param min Minimum value (inclusive)
    /// @param max Maximum value (inclusive)
    /// @return The random number in the specified range
    function getRandomNumberInRange(
        bytes32 requestId,
        uint256 min,
        uint256 max
    ) external view onlyWhenNotPaused returns (uint256) {
        require(min <= max, "Min must be less than or equal to max");

        uint256 random = getRandomNumber(requestId);
        return (random % (max - min + 1)) + min;
    }

    /// @notice Get a random boolean
    /// @param requestId The request ID
    /// @return True or false with 50% probability
    function getRandomBoolean(
        bytes32 requestId
    ) external view onlyWhenNotPaused returns (bool) {
        uint256 random = getRandomNumber(requestId);
        return random % 2 == 0;
    }

    /// @notice Get a random percentage (0-100)
    /// @param requestId The request ID
    /// @return A random percentage value
    function getRandomPercentage(
        bytes32 requestId
    ) external view onlyWhenNotPaused returns (uint256) {
        return getRandomNumberInRange(requestId, 0, 100);
    }

    /// @notice Get a random index from an array
    /// @param requestId The request ID
    /// @param length The length of the array
    /// @return A random index (0 to length-1)
    function getRandomIndex(
        bytes32 requestId,
        uint256 length
    ) external view onlyWhenNotPaused returns (uint256) {
        require(length > 0, "Array length must be greater than 0");
        return getRandomNumberInRange(requestId, 0, length - 1);
    }

    // ====================== CHAINLINK VRF CALLBACK ======================

    /// @notice Chainlink VRF callback function
    /// @dev This function is called by the Chainlink oracle when the random number is ready
    /// @param requestId The request ID
    /// @param randomness The random number
    function fulfillRandomWords(
        bytes32 requestId,
        uint256[] memory randomness
    ) internal override {
        require(
            requestExists[requestId],
            "Request does not exist"
        );

        uint256 randomNumber = randomness[0];

        // Scale random number to the configured range
        randomNumber = (randomNumber % (
            gameConfig.maxRandomNumber -
            gameConfig.minRandomNumber +
            1
        )) + gameConfig.minRandomNumber;

        randomNumbers[requestId] = randomNumber;

        emit RandomNumberReceived(requestId, randomNumber, msg.sender);
    }

    // ====================== PAUSABLE FUNCTIONS ======================

    /// @notice Pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    // ====================== UUPS UPGRADE ======================

    /// @custom:oz-upgradeable
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // ====================== GETTERS ======================

    /// @notice Get the LINK token address
    /// @return Address of LINK token
    function getLinkAddress() external view returns (address) {
        return s_linkAddress;
    }

    /// @notice Get the key hash for VRF
    /// @return The key hash
    function getKeyHash() external view returns (bytes32) {
        return s_linkKeyHash;
    }

    /// @notice Get the fee for VRF requests
    /// @return The fee in LINK
    function getFee() external view returns (uint256) {
        return s_fee;
    }

    /// @notice Get all configured price feed symbols
    /// @return Array of symbol strings
    function getAllPriceFeedSymbols() external view returns (string[] memory) {
        // Note: This is a simplified implementation
        // In production, you might want to track symbols in a separate array
        string[] memory symbols = new string[](0);
        return symbols;
    }

    /// @notice Check if a request has timed out
    /// @param requestId The request ID
    /// @return Whether the request has timed out
    function hasRequestTimedOut(
        bytes32 requestId
    ) external view onlyWhenNotPaused returns (bool) {
        return block.timestamp > requestTimestamps[requestId] + gameConfig.requestTimeout;
    }

    // ====================== LINK TOKEN ======================

    /// @notice Get the LINK token contract
    /// @return The LINK token contract
    function LINK() internal view returns (IERC20Upgradeable) {
        return IERC20Upgradeable(s_linkAddress);
    }
}

// Interface for Chainlink Aggregator V3
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}
