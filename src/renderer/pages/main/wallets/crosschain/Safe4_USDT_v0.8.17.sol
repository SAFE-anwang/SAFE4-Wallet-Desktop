// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}


/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;

  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   * function Ownable() public {
  *   owner = msg.sender;
   * }
   */
  constructor() public {
    owner = msg.sender;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }


  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    emit OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

}

/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
contract Pausable is Ownable {
  event Pause();
  event Unpause();

  bool public paused = false;


  /**
   * @dev Modifier to make a function callable only when the contract is not paused.
   */
  modifier whenNotPaused() {
    require(!paused);
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is paused.
   */
  modifier whenPaused() {
    require(paused);
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() onlyOwner whenNotPaused public {
    paused = true;
    emit Pause();
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  function unpause() onlyOwner whenPaused public {
    paused = false;
    emit Unpause();
  }
}

contract BlackList is Ownable {

    /////// Getter to allow the same blacklist to be used also by other contracts (including upgraded Tether) ///////
    function getBlackListStatus(address _maker) external view returns (bool) {
        return isBlackListed[_maker];
    }

    mapping (address => bool) public isBlackListed;

    function addBlackList (address _evilUser) public onlyOwner {
        isBlackListed[_evilUser] = true;
        emit AddedBlackList(_evilUser);
    }

    function removeBlackList (address _clearedUser) public onlyOwner {
        isBlackListed[_clearedUser] = false;
        emit RemovedBlackList(_clearedUser);
    }

    event AddedBlackList(address indexed _user);
    event RemovedBlackList(address indexed _user);
}


/**
 * @title ERC20Basic
 * @dev Simpler version of ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/179
 */
abstract contract ERC20Basic {
  function totalSupply() public view virtual returns (uint);
  function balanceOf(address who) public view virtual returns (uint256);
  function transfer(address to, uint256 value) public virtual returns (bool);
  event Transfer(address indexed from, address indexed to, uint256 value);
}

/**
 * @title Basic token
 * @dev Basic version of StandardToken, with no allowances.
 */
abstract contract BasicToken is ERC20Basic {
  using SafeMath for uint256;

  mapping(address => uint256) internal balances;
  uint256 internal _totalSupply;

  function totalSupply() public override virtual view returns (uint) {
    return _totalSupply;
  }

  /**
  * @dev transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public override virtual returns (bool) {
    require(_to != address(0));
    require(_value <= balances[msg.sender]);

    // SafeMath.sub will throw if there is not enough balance.
    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    emit Transfer(msg.sender, _to, _value);
    return true;
  }

  /**
  * @dev Gets the balance of the specified address.
  * @param _owner The address to query the the balance of.
  * @return balance An uint256 representing the amount owned by the passed address.
  */
  function balanceOf(address _owner) public override virtual view returns (uint256 balance) {
    return balances[_owner];
  }

}


/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
abstract contract ERC20 is ERC20Basic {
  function allowance(address owner, address spender) public virtual view returns (uint256);
  function transferFrom(address from, address to, uint256 value) public virtual returns (bool);
  function approve(address spender, uint256 value) public virtual returns (bool);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @title Standard ERC20 token
 *
 * @dev Implementation of the basic standard token.
 * @dev https://github.com/ethereum/EIPs/issues/20
 * @dev Based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
abstract contract StandardToken is ERC20, BasicToken {

  using SafeMath for uint256;
  mapping (address => mapping (address => uint256)) internal allowed;

  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function transferFrom(address _from, address _to, uint256 _value) public override virtual returns (bool) {
    require(_to != address(0));
    require(_value <= balances[_from]);
    require(_value <= allowed[_from][msg.sender]);

    balances[_from] = balances[_from].sub(_value);
    balances[_to] = balances[_to].add(_value);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    emit Transfer(_from, _to, _value);
    return true;
  }

  /**
   * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
   *
   * Beware that changing an allowance with this method brings the risk that someone may use both the old
   * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
   * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   * @param _spender The address which will spend the funds.
   * @param _value The amount of tokens to be spent.
   */
  function approve(address _spender, uint256 _value) public override virtual  returns (bool) {
    allowed[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);
    return true;
  }

  /**
   * @dev Function to check the amount of tokens that an owner allowed to a spender.
   * @param _owner address The address which owns the funds.
   * @param _spender address The address which will spend the funds.
   * @return A uint256 specifying the amount of tokens still available for the spender.
   */
  function allowance(address _owner, address _spender) public override virtual view returns (uint256) {
    return allowed[_owner][_spender];
  }

  /**
   * approve should be called when allowed[_spender] == 0. To increment
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   */
  function increaseApproval(address _spender, uint _addedValue) public virtual returns (bool) {
    allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
    emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }

  function decreaseApproval(address _spender, uint _subtractedValue) public virtual returns (bool) {
    uint oldValue = allowed[msg.sender][_spender];
    if (_subtractedValue > oldValue) {
      allowed[msg.sender][_spender] = 0;
    } else {
      allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
    }
    emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }
}


contract StandardTokenWithFees is StandardToken, Ownable {

  using SafeMath for uint256;

  // Additional variables for use if transaction fees ever became necessary
  uint256 public basisPointsRate = 0;
  uint256 public maximumFee = 0;
  uint256 constant MAX_SETTABLE_BASIS_POINTS = 20;
  uint256 constant MAX_SETTABLE_FEE = 50;

  string public name;
  string public symbol;
  uint8 public decimals;

  uint public constant MAX_UINT = 2**256 - 1;

  function calcFee(uint _value) public view returns (uint) {
    uint fee = (_value.mul(basisPointsRate)).div(10000);
    if (fee > maximumFee) {
        fee = maximumFee;
    }
    return fee;
  }

  function transfer(address _to, uint _value) public override(BasicToken, ERC20Basic) virtual returns (bool) {
    uint fee = calcFee(_value);
    uint sendAmount = _value.sub(fee);

    super.transfer(_to, sendAmount);
    if (fee > 0) {
      super.transfer(owner, fee);
    }
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _value) public override(StandardToken) virtual returns (bool) {
    require(_to != address(0));
    require(_value <= balances[_from]);
    require(_value <= allowed[_from][msg.sender]);

    uint fee = calcFee(_value);
    uint sendAmount = _value.sub(fee);

    balances[_from] = balances[_from].sub(_value);
    balances[_to] = balances[_to].add(sendAmount);
    if (allowed[_from][msg.sender] < MAX_UINT) {
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    }
    emit Transfer(_from, _to, sendAmount);
    if (fee > 0) {
      balances[owner] = balances[owner].add(fee);
      emit Transfer(_from, owner, fee);
    }
    return true;
  }

  function setParams(uint newBasisPoints, uint newMaxFee) public onlyOwner {
      // Ensure transparency by hardcoding limit beyond which fees can never be added
      require(newBasisPoints < MAX_SETTABLE_BASIS_POINTS);
      require(newMaxFee < MAX_SETTABLE_FEE);

      basisPointsRate = newBasisPoints;
      maximumFee = newMaxFee.mul(uint(10)**decimals);

      emit Params(basisPointsRate, maximumFee);
  }

  // Called if contract ever adds fees
  event Params(uint feeBasisPoints, uint maxFee);

}

abstract contract UpgradedStandardToken is StandardToken {
    // those methods are called by the legacy contract
    // and they must ensure msg.sender to be the contract address
    function transferByLegacy(address from, address to, uint value) public virtual returns (bool);
    function transferFromByLegacy(address sender, address from, address spender, uint value) public virtual returns (bool);
    function approveByLegacy(address from, address spender, uint value) public virtual returns (bool);
    function increaseApprovalByLegacy(address from, address spender, uint addedValue) public virtual returns (bool);
    function decreaseApprovalByLegacy(address from, address spender, uint subtractedValue) public virtual returns (bool);
}


contract TetherToken is Pausable, StandardTokenWithFees, BlackList {

    using SafeMath for uint256;
    address public upgradedAddress;
    bool public deprecated;

    //  The contract can be initialized with a number of tokens
    //  All the tokens are deposited to the owner address
    //
    // @param _balance Initial supply of the contract
    // @param _name Token Name
    // @param _symbol Token symbol
    // @param _decimals Token decimals
    constructor(uint _initialSupply, string memory _name, string memory _symbol, uint8 _decimals) public {
        _totalSupply = _initialSupply;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        balances[owner] = _initialSupply;
        deprecated = false;
    }

    // Forward ERC20 methods to upgraded contract if this one is deprecated
    function transfer(address _to, uint _value) public override whenNotPaused returns (bool) {
        require(!isBlackListed[msg.sender]);
        if (deprecated) {
            return UpgradedStandardToken(upgradedAddress).transferByLegacy(msg.sender, _to, _value);
        } else {
            return super.transfer(_to, _value);
        }
    }

    // Forward ERC20 methods to upgraded contract if this one is deprecated
    function transferFrom(address _from, address _to, uint _value) public override whenNotPaused returns (bool) {
        require(!isBlackListed[_from]);
        if (deprecated) {
            return UpgradedStandardToken(upgradedAddress).transferFromByLegacy(msg.sender, _from, _to, _value);
        } else {
            return super.transferFrom(_from, _to, _value);
        }
    }

    // Forward ERC20 methods to upgraded contract if this one is deprecated
    function balanceOf(address who) public override(BasicToken,ERC20Basic) view returns (uint) {
        if (deprecated) {
            return UpgradedStandardToken(upgradedAddress).balanceOf(who);
        } else {
            return super.balanceOf(who);
        }
    }

    // Allow checks of balance at time of deprecation
    function oldBalanceOf(address who) public view returns (uint) {
        if (deprecated) {
            return super.balanceOf(who);
        }
    }

    // Forward ERC20 methods to upgraded contract if this one is deprecated
    function approve(address _spender, uint _value) public override  whenNotPaused returns (bool) {
        if (deprecated) {
            return UpgradedStandardToken(upgradedAddress).approveByLegacy(msg.sender, _spender, _value);
        } else {
            return super.approve(_spender, _value);
        }
    }

    function increaseApproval(address _spender, uint _addedValue) public override  whenNotPaused returns (bool) {
        if (deprecated) {
            return UpgradedStandardToken(upgradedAddress).increaseApprovalByLegacy(msg.sender, _spender, _addedValue);
        } else {
            return super.increaseApproval(_spender, _addedValue);
        }
    }

    function decreaseApproval(address _spender, uint _subtractedValue) public override  whenNotPaused returns (bool) {
        if (deprecated) {
            return UpgradedStandardToken(upgradedAddress).decreaseApprovalByLegacy(msg.sender, _spender, _subtractedValue);
        } else {
            return super.decreaseApproval(_spender, _subtractedValue);
        }
    }

    // Forward ERC20 methods to upgraded contract if this one is deprecated
    function allowance(address _owner, address _spender) public override  view returns (uint remaining) {
        if (deprecated) {
            return StandardToken(upgradedAddress).allowance(_owner, _spender);
        } else {
            return super.allowance(_owner, _spender);
        }
    }

    // deprecate current contract in favour of a new one
    function deprecate(address _upgradedAddress) public onlyOwner {
        require(_upgradedAddress != address(0));
        deprecated = true;
        upgradedAddress = _upgradedAddress;
        emit Deprecate(_upgradedAddress);
    }

    // deprecate current contract if favour of a new one
    function totalSupply() public override(BasicToken,ERC20Basic)  view returns (uint) {
        if (deprecated) {
            return StandardToken(upgradedAddress).totalSupply();
        } else {
            return _totalSupply;
        }
    }

    // Issue a new amount of tokens
    // these tokens are deposited into the owner address
    //
    // @param _amount Number of tokens to be issued
    function issue(uint amount) internal onlyOwner {
        balances[owner] = balances[owner].add(amount);
        _totalSupply = _totalSupply.add(amount);
        emit Issue(amount);
        emit Transfer(address(0), owner, amount);
    }

    // Redeem tokens.
    // These tokens are withdrawn from the owner address
    // if the balance must be enough to cover the redeem
    // or the call will fail.
    // @param _amount Number of tokens to be issued
    function redeem(uint amount) internal onlyOwner {
        _totalSupply = _totalSupply.sub(amount);
        balances[owner] = balances[owner].sub(amount);
        emit Redeem(amount);
        emit Transfer(owner, address(0), amount);
    }

    function destroyBlackFunds (address _blackListedUser) public onlyOwner {
        require(isBlackListed[_blackListedUser]);
        uint dirtyFunds = balanceOf(_blackListedUser);
        balances[_blackListedUser] = 0;
        _totalSupply = _totalSupply.sub(dirtyFunds);
        emit DestroyedBlackFunds(_blackListedUser, dirtyFunds);
    }

    event DestroyedBlackFunds(address indexed _blackListedUser, uint _balance);

    // Called when new token are issued
    event Issue(uint amount);

    // Called when tokens are redeemed
    event Redeem(uint amount);

    // Called when contract is deprecated
    event Deprecate(address newAddress);

}

/**
 * @title Safe4USDT
 * @dev Simplified USDT contract for Safe4 cross-chain operations
 * @dev Inherits from TetherToken and adds minimal cross-chain support
 */
contract Safe4USDT is TetherToken {
    using SafeMath for uint256;
    // 网络描述符映射（如 "eth", "bsc", "tron", "sol"）
    mapping(string => bool) private supportedNetworks;

    // 交易ID映射，防止重复处理（包含网络信息）
    mapping(string => string) private processedTxIds;

    // Issue记录结构体
    struct IssueRecord {
        address to;           // 接收地址（SAFE4地址）
        uint256 amount;       // 发行金额
        string network;       // 网络
        string txId;          // 交易ID（支持所有区块链格式）
        uint256 timestamp;    // 时间戳
        uint256 blockNumber;  // 区块号
    }

    // Redeem记录结构体
    struct RedeemRecord {
        address from;         // 源地址（SAFE4地址）
        string to;            // 目的地址（支持所有区块链格式）
        uint256 amount;       // 赎回金额
        string network;       // 网络
        uint256 timestamp;    // 时间戳
        uint256 blockNumber;  // 区块号
    }

    // Issue记录映射（按交易ID索引）
    mapping(string => IssueRecord) private issueRecords;
    string[] private issueTxIds;  // 所有Issue交易ID数组，用于批量查询

    // Redeem记录映射（按用户地址+序号索引）
    mapping(address => mapping(uint256 => RedeemRecord)) private redeemRecords;
    mapping(address => uint256) private userRedeemCount;  // 用户赎回次数

    // 全局记录索引
    uint256 public totalIssueRecords;    // 总发行记录数
    uint256 public totalRedeemRecords;   // 总赎回记录数

    // 网络统计信息
    mapping(string => uint256) private networkIssueCount;    // 各网络发行次数
    mapping(string => uint256) private networkRedeemCount;   // 各网络赎回次数
    mapping(string => uint256) private networkIssueAmount;  // 各网络发行总量
    mapping(string => uint256) private networkRedeemAmount; // 各网络赎回总量

    // 全局统计信息
    uint256 public totalIssueCount;     // 总发行次数
    uint256 public totalRedeemCount;    // 总赎回次数
    uint256 public totalIssueAmount;    // 总发行量
    uint256 public totalRedeemAmount;   // 总赎回量

    // 跨链操作事件
    event CrossChainIssue(address indexed _to, uint amount, string network, string txId);
    event CrossChainRedeem(address indexed _from, string _to, uint amount, string network);
    event NetworkAdded(string network);
    event NetworkRemoved(string network);

    // 构造函数
    constructor(uint _initialSupply, string memory _name, string memory _symbol, uint8 _decimals)
        TetherToken(_initialSupply, _name, _symbol, _decimals) public {

        // 初始化支持的网络描述符
        supportedNetworks["eth"] = true;
        supportedNetworks["bsc"] = true;
        supportedNetworks["tron"] = true;
        supportedNetworks["sol"] = true;
    }

    // 跨链发行USDT（带交易ID防重复）
    function crossChainIssue(address _to, uint amount, string memory _network, string memory _txId) public onlyOwner whenNotPaused {
        require(_to != address(0), "Cannot issue to zero address");
        require(_to != address(this), "Cannot issue to contract itself");
        require(amount > 0, "Amount must be greater than 0");
        require(supportedNetworks[_network], "Unsupported network");
        require(bytes(_txId).length > 0, "Transaction ID cannot be empty");
        require(bytes(processedTxIds[_txId]).length == 0, "Transaction ID already processed");

        // 标记交易ID为已处理（存储网络信息，防止重复处理）
        processedTxIds[_txId] = _network;

        // 直接发行到目标地址（最关键的状态变更）
        balances[_to] = balances[_to].add(amount);
        _totalSupply = _totalSupply.add(amount);

        // 更新统计信息
        networkIssueCount[_network]++;
        networkIssueAmount[_network] = networkIssueAmount[_network].add(amount);
        totalIssueCount++;
        totalIssueAmount = totalIssueAmount.add(amount);

        // 记录Issue详细信息
        issueRecords[_txId] = IssueRecord({
            to: _to,
            amount: amount,
            network: _network,
            txId: _txId,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        issueTxIds.push(_txId);  // 添加到交易ID数组
        totalIssueRecords++;

        // 触发事件
        emit Issue(amount);
        emit CrossChainIssue(_to, amount, _network, _txId);
        emit Transfer(address(0), _to, amount);
    }

    // 跨链赎回USDT（带目标地址）
    function crossChainRedeem(uint amount, string memory _network, string memory _to) public whenNotPaused {
        require(!isBlackListed[msg.sender], "Sender is blacklisted");
        require(amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(supportedNetworks[_network], "Unsupported network");
        require(bytes(_to).length > 0, "Target address cannot be empty");

        // 防止重入攻击
        uint currentBalance = balances[msg.sender];
        require(currentBalance >= amount, "Balance check failed");

        // 先更新余额状态，防止重入攻击（最关键的状态变更）
        balances[msg.sender] = currentBalance.sub(amount);
        _totalSupply = _totalSupply.sub(amount);

        // 更新统计信息
        networkRedeemCount[_network]++;
        networkRedeemAmount[_network] = networkRedeemAmount[_network].add(amount);
        totalRedeemCount++;
        totalRedeemAmount = totalRedeemAmount.add(amount);

        // 记录Redeem详细信息
        uint256 userRedeemIndex = userRedeemCount[msg.sender];
        redeemRecords[msg.sender][userRedeemIndex] = RedeemRecord({
            from: msg.sender,
            to: _to,
            amount: amount,
            network: _network,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        userRedeemCount[msg.sender]++;
        totalRedeemRecords++;

        // 触发跨链事件
        emit CrossChainRedeem(msg.sender, _to, amount, _network);
        emit Transfer(msg.sender, address(0), amount);
    }

    // 添加新网络支持
    function addNetwork(string memory _network) public onlyOwner {
        require(bytes(_network).length > 0, "Network name cannot be empty");
        require(!supportedNetworks[_network], "Network already supported");
        supportedNetworks[_network] = true;
        emit NetworkAdded(_network);
    }

    // 移除网络支持
    function removeNetwork(string memory _network) public onlyOwner {
        require(supportedNetworks[_network], "Network not supported");
        supportedNetworks[_network] = false;
        emit NetworkRemoved(_network);
    }

    // 检查网络是否支持
    function isNetworkSupported(string memory _network) public view returns (bool) {
        return supportedNetworks[_network];
    }

    // 检查交易ID是否已处理
    function isTxIdProcessed(string memory _txId) public view returns (bool) {
        return bytes(processedTxIds[_txId]).length > 0;
    }

    // 获取交易ID对应的网络
    function getTxIdNetwork(string memory _txId) public view returns (string memory) {
        return processedTxIds[_txId];
    }

    // 紧急功能：重置交易ID状态（仅限合约所有者）
    function resetTxId(string memory _txId) public onlyOwner {
        processedTxIds[_txId] = "";
    }


    // 统计查询函数
    function getNetworkStats(string memory _network) public view returns (
        uint256 issueCount,
        uint256 redeemCount,
        uint256 issueAmount,
        uint256 redeemAmount
    ) {
        return (
            networkIssueCount[_network],
            networkRedeemCount[_network],
            networkIssueAmount[_network],
            networkRedeemAmount[_network]
        );
    }

    function getGlobalStats() public view returns (
        uint256 totalIssues,
        uint256 totalRedeems,
        uint256 totalIssued,
        uint256 totalRedeemed,
        uint256 currentSupply
    ) {
        return (
            totalIssueCount,
            totalRedeemCount,
            totalIssueAmount,
            totalRedeemAmount,
            _totalSupply
        );
    }

    function getAllNetworksStats() public view returns (
        string[4]  memory networks,
        uint256[4] memory issueCounts,
        uint256[4] memory redeemCounts,
        uint256[4] memory issueAmounts,
        uint256[4] memory redeemAmounts
    ) {
        networks[0] = "eth";
        networks[1] = "bsc";
        networks[2] = "tron";
        networks[3] = "sol";

        issueCounts[0] = networkIssueCount["eth"];
        issueCounts[1] = networkIssueCount["bsc"];
        issueCounts[2] = networkIssueCount["tron"];
        issueCounts[3] = networkIssueCount["sol"];

        redeemCounts[0] = networkRedeemCount["eth"];
        redeemCounts[1] = networkRedeemCount["bsc"];
        redeemCounts[2] = networkRedeemCount["tron"];
        redeemCounts[3] = networkRedeemCount["sol"];

        issueAmounts[0] = networkIssueAmount["eth"];
        issueAmounts[1] = networkIssueAmount["bsc"];
        issueAmounts[2] = networkIssueAmount["tron"];
        issueAmounts[3] = networkIssueAmount["sol"];

        redeemAmounts[0] = networkRedeemAmount["eth"];
        redeemAmounts[1] = networkRedeemAmount["bsc"];
        redeemAmounts[2] = networkRedeemAmount["tron"];
        redeemAmounts[3] = networkRedeemAmount["sol"];
    }

    // 获取合约版本信息
    function getContractVersion() public pure returns (string memory) {
        return "Safe4USDT v1.0.0";
    }

    // 记录查询函数
    function getIssueRecord(string memory _txId) public view returns (
        address to,
        uint256 amount,
        string memory network,
        string memory txId,
        uint256 timestamp,
        uint256 blockNumber
    ) {
        IssueRecord memory record = issueRecords[_txId];
        return (
            record.to,
            record.amount,
            record.network,
            record.txId,
            record.timestamp,
            record.blockNumber
        );
    }

    // 检查Issue记录是否存在
    function isIssueRecordExists(string memory _txId) public view returns (bool) {
        IssueRecord memory record = issueRecords[_txId];
        return (bytes(record.txId).length > 0 && record.timestamp > 0);
    }

    // 获取所有Issue交易ID的数量
    function getIssueTxIdsCount() public view returns (uint256) {
        return issueTxIds.length;
    }

    // 批量查询Issue记录
    function getIssueRecords(uint256 _startIndex, uint256 _count) public view returns (
        address[] memory tos,
        uint256[] memory amounts,
        string[] memory networks,
        string[] memory txIds,
        uint256[] memory timestamps,
        uint256[] memory blockNumbers
    ) {
        uint256 totalCount = issueTxIds.length;
        require(_startIndex < totalCount, "Start index out of range");

        uint256 endIndex = _startIndex + _count;
        if (endIndex > totalCount) {
            endIndex = totalCount;
        }

        uint256 actualCount = endIndex - _startIndex;

        tos = new address[](actualCount);
        amounts = new uint256[](actualCount);
        networks = new string[](actualCount);
        txIds = new string[](actualCount);
        timestamps = new uint256[](actualCount);
        blockNumbers = new uint256[](actualCount);

        for (uint256 i = 0; i < actualCount; i++) {
            string memory txId = issueTxIds[_startIndex + i];
            IssueRecord memory record = issueRecords[txId];
            tos[i] = record.to;
            amounts[i] = record.amount;
            networks[i] = record.network;
            txIds[i] = record.txId;
            timestamps[i] = record.timestamp;
            blockNumbers[i] = record.blockNumber;
        }
    }

    // 获取最新的Issue记录
    function getLatestIssueRecords(uint256 _count) public view returns (
        address[] memory tos,
        uint256[] memory amounts,
        string[] memory networks,
        string[] memory txIds,
        uint256[] memory timestamps,
        uint256[] memory blockNumbers
    ) {
        uint256 totalCount = issueTxIds.length;
        if (totalCount == 0) {
            return (new address[](0), new uint256[](0), new string[](0), new string[](0), new uint256[](0), new uint256[](0));
        }

        uint256 startIndex = totalCount > _count ? totalCount - _count : 0;
        return getIssueRecords(startIndex, _count);
    }

    function getUserRedeemRecord(address _user, uint256 _index) public view returns (
        address from,
        string memory to,
        uint256 amount,
        string memory network,
        uint256 timestamp,
        uint256 blockNumber
    ) {
        require(_index < userRedeemCount[_user], "Record index out of range");
        RedeemRecord memory record = redeemRecords[_user][_index];
        return (
            record.from,
            record.to,
            record.amount,
            record.network,
            record.timestamp,
            record.blockNumber
        );
    }

    // 检查用户Redeem记录是否存在
    function isUserRedeemRecordExists(address _user, uint256 _index) public view returns (bool) {
        if (_index >= userRedeemCount[_user]) {
            return false;
        }
        RedeemRecord memory record = redeemRecords[_user][_index];
        return (record.from != address(0) && record.timestamp > 0);
    }

    function getUserRedeemCount(address _user) public view returns (uint256) {
        return userRedeemCount[_user];
    }

    function getTotalRecords() public view returns (
        uint256 totalIssues,
        uint256 totalRedeems
    ) {
        return (
            totalIssueRecords,
            totalRedeemRecords
        );
    }

    // 批量查询用户赎回记录
    function getUserRedeemRecords(address _user, uint256 _startIndex, uint256 _count) public view returns (
        address[] memory froms,
        string[]  memory tos,
        uint256[] memory amounts,
        string[]  memory networks,
        uint256[] memory timestamps,
        uint256[] memory blockNumbers
    ) {
        uint256 userCount = userRedeemCount[_user];
        require(_startIndex < userCount, "Start index out of range");

        uint256 endIndex = _startIndex + _count;
        if (endIndex > userCount) {
            endIndex = userCount;
        }

        uint256 actualCount = endIndex - _startIndex;

        froms = new address[](actualCount);
        tos = new string[](actualCount);
        amounts = new uint256[](actualCount);
        networks = new string[](actualCount);
        timestamps = new uint256[](actualCount);
        blockNumbers = new uint256[](actualCount);

        for (uint256 i = 0; i < actualCount; i++) {
            RedeemRecord memory record = redeemRecords[_user][_startIndex + i];
            froms[i] = record.from;
            tos[i] = record.to;
            amounts[i] = record.amount;
            networks[i] = record.network;
            timestamps[i] = record.timestamp;
            blockNumbers[i] = record.blockNumber;
        }
    }
}
