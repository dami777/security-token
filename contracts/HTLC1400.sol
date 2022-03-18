pragma solidity 0.8.10;

import "./utils/IERC1400.sol";



/// @title HTLC to release security from issuer to investor 

contract HTLC1400 {


    /// @notice Contract for DVP. Seller discloses the preimage of the hash. Secret is exchanged for money over the block chain
    /// @notice Seller is permitted to spend the funds by disclosing the preimage of a hash
    /// @notice Buyer is permitted to spend the funds after a timeout is reached, in a refund situation
    /// @dev    HTLC enable atomic swap
    /// @dev    Buyer: entity that receives funds from seller once the seller reveals the secret
    /// @dev    Seller: entity that contributes funds to the buyer by revealing the secret or refunds after expiration
    /// @dev    Secret: random number chosen by the seller revealed to allow the buyer to redeem the funds
    /// @dev    Secret Hash: hash of the secret. used in the construction of the HTLC
    /// @dev    Expiration: timestamp that determines when seller and buyer can redeem



    /// @TODO 
    /// @dev issuer funds the HTLC1400 with open order
    /// @dev Recipient enters the secret and withdraws the security token provided the order is still OPEN
    /// @dev implement timelock to refund the token to the issuer if the order expires while it is still OPEN

    /// @dev    The swap state solves some of the following security problem:
    /// @notice If swap state if not monitored, recipient can attempt the expected amount to withdraw multiple times within the timeframe
    /// @notice When the swap reaches expiration, before attempting to refund, it is needed to know the state of withdrawal. There is no need to refund the token if a withdrawal was successful



    IERC1400 public ERC1400_TOKEN;
   

    mapping(bytes32 => OrderSwap) internal _orderSwap;      //  map the order to the secrete
    //  mapping(bytes32 => bool) internal _uniqueSecret;        //  ensure that the secret is unique on the blockchain
    mapping(bytes32 => SwapState) internal _swapState;      //  to keep track of the swap state of a particular secret
    
    struct OrderSwap {

        address _recipient;
        uint256 _tokenValue;
        uint256 _expiration;
        bytes32 _secretHash;
        bytes32 _partition;
        
    }


    enum SwapState {

        INVALID,
        OPEN,
        CLOSED,
        EXPIRED
    }

    constructor(address _securityToken) {

        ERC1400_TOKEN = IERC1400(_securityToken);
        
    }



    /// @dev    when an order is opened, the issuer funds the contract with the token
    /// @param  _recipient is the target recipient/withdrawal of the deposited token
    /// @param  _tokenValue is the amount of token to be withdrawn by the investor
    /// @param  _expiration is the time the token withdrawal elasp. There will be a refund to the issuer's wallet if the token isn't withdrawn
    /// @param  _secretKey is the secret word or phrase attached to an order
    /// @param  _secretHash is the hash of the secret that must be provided by the recipient for the recipient to withdraw the security token
    /// @param  _partition is the partition where the token will be withdrawn into, in the investor's wallet
    /// @param  _data is the encoded certificate that will be decoded to ensure that the recipient is a whitelisted investor
    /// @dev    this htlc contract address should be approved as an operator using "authorizeOperator" accross all partitions or "authorizeOperatorByPartition" for the specific partitions where tokens need to be deposited for the atomic swap
    /// @notice ERC1400_TOKEN.operatorTransferByPartition function moves the tokens from the issuer wallets to the htlc address

    function openOrder(address _recipient, uint256 _tokenValue, uint256 _expiration, bytes32 _secretKey, bytes32 _secretHash, bytes32 _partition, bytes memory _data) external {

        /// --->    logic to check the whitelist status of the recipient should be checked here

        require(!_uniqueSecret[_secretHash], "this secret has been used");
        _orderSwap[_secretHash] = OrderSwap(_recipient, _tokenValue, _expiration, _secretHash, _partition);         // save the order on the blockchain so that the target investor can make reference to it for withdrawal
        ERC1400_TOKEN.operatorTransferByPartition(_partition, msg.sender, address(this), _tokenValue, "", _data);   // the htlc contract moves tokens from the caller's wallet, i.e the issuer and deposits them in its address to be released to the expected recipient
        _swapState[_secretHash] = SwapState.OPEN;
        emit OpenedOrder(_recipient, _tokenValue, _expiration, _secretHash, _partition);

    }



    /// @param  _secret is the secret the recipient provides to withdraw the token from the htlc contract
    /// @notice the existence of the hash of the secret is checked to be sure that it exist
    /// @notice the swap state of the secret is checked to ensure that a recipient can only attempt a withdrawal when it's OPEN. if INVALID, CLOSED, or EXPIRED, withdrawal will not be possible
    /// @notice that OPEN is present tense

    function recipientWithdrawal(bytes32 _secretKey) external {

        bytes32 _secretHash = sha256(abi.encode(_secret));
        require(_uniqueSecret[_secretHash], "invalid secret");
        require(_swapState[_secretHash] == SwapState.OPEN);
        OrderSwap memory _order = _orderSwap[_secretHash];

        //// continue from here by creating modifiers and conditions that checks the validity of a swap

    }

    
    event OpenedOrder(address indexed _recipient, uint256 _amount, uint256 _expiration, bytes32 _secretHash, bytes32 _partition);
}