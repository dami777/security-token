pragma solidity 0.8.10;

//  SPDX-License-Identifier: UNLICENSED

import "../utils/IERC1400.sol";
import "../utils/OrderLibrary.sol";



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



    
   

    mapping(address => mapping(bytes32 => OrderSwap)) private _orderSwap;      //  map the order struct to the order ID
    mapping(address => mapping(bytes32 => OrderLibrary.SwapState)) private _swapState;      //  to keep track of the swap state of an id
   


    struct OrderSwap {

        
        address _investor;
        address _issuer;
        address _ERC1400_ADDRESS;
        uint256 _tokenValue;
        uint256 _expiration;
        bytes32 _secretHash;
        bytes32 _secretKey;
        bytes32 _partition;
        bytes32 _swapID;
        
    }




    /// @dev    when an order is opened, the issuer funds the contract with the token
    /// @notice the security token address is used to keep track of the order and swap state 
    /// @param   _swapID is the ID of the swap order that keeps track of the state of the order. The withdrawee will make reference to this ID on this contract and their deposit contract as well. The SwapState of that ID must be invalid which means it has not been used
    /// @param  _investor is the target recipient/withdrawal of the deposited token
    /// @param  _securityToken is the address of the security token to be deposited by the issuer and to be withdrawn by the investor
    /// @param  _tokenValue is the amount of token to be withdrawn by the investor
    /// @param  _expiration is the time the token withdrawal elasp. There will be a refund to the issuer's wallet if the token isn't withdrawn
    /// @param  _secretKey is the secret word or phrase attached to an order
    /// @param  _secretHash is the hash of the secret that must be provided by the recipient for the recipient to withdraw the security token
    /// @param  _partition is the partition where the token will be withdrawn into, in the investor's wallet
    /// @param  _data is the encoded certificate that will be decoded to ensure that the recipient is a whitelisted investor
    /// @dev    this htlc contract address should be approved as an operator using "authorizeOperator" accross all partitions or "authorizeOperatorByPartition" for the specific partitions where tokens need to be deposited for the atomic swap
    /// @dev    with the uniqueness of the IDS, the secrets dont have to be unique accross the blockchain. The unique ID will keep track of each unique swap orders
    /// @notice IERC1400(_orderSwap[_securityToken][_swapID]._ERC1400_ADDRESS).operatorTransferByPartition function moves the tokens from the issuer wallets to the htlc address

    function openOrder(bytes32 _swapID, bytes32 _secretKey, bytes32 _secretHash, bytes32 _partition, address _investor, address _securityToken, uint256 _tokenValue, uint256 _expiration, bytes memory _data) external {


        require(_swapState[_securityToken][_swapID] == OrderLibrary.SwapState.INVALID, "order ID exist already");
        require( _secretHash == sha256(abi.encode(_secretKey)), "the secret doesn't match the hash");
        require(_expiration > block.timestamp, "expiration time is less than present time");
        _orderSwap[_securityToken][_swapID] = OrderSwap(_investor, msg.sender, _securityToken, _tokenValue, _expiration, _secretHash, bytes32(0), _partition, _swapID);         // save the order on the blockchain so that the target investor can make reference to it for withdrawal
        IERC1400(_orderSwap[_securityToken][_swapID]._ERC1400_ADDRESS).operatorTransferByPartition(_partition, msg.sender, address(this), _tokenValue, "", _data);                        // the htlc contract moves tokens from the caller's wallet, i.e the issuer and deposits them in its address to be released to the expected recipient
        _swapState[_securityToken][_swapID] = OrderLibrary.SwapState.OPEN;                                                                                            // keep the order state OPEN till it is CLOSES or EXPIRES
        emit OpenedOrder(msg.sender, _investor, _securityToken, _swapID, _tokenValue, _expiration, _secretHash, _partition);

    }



    /// @param  _secretKey is the secret the recipient provides to withdraw the token from the htlc contract    
    /// @param  _swapID is the ID of the order. The ID provided must be valid
    /// @notice the existence of the hash of the secret is checked to be sure that it exist
    /// @notice the swap state of the ID is checked to ensure that a recipient can only attempt a withdrawal when it's OPEN. When INVALID, CLOSED, or EXPIRED, withdrawal will not be possible
    /// @notice that OPEN is present tense
    /// @notice `msg.sender` is equal the recipient of the token
    /// @notice `block.timestamp` is less than `expiration value` for valid withdrawal
    /// @notice `_swapState[_securityToken][_swapID] = OrderLibrary.SwapState.CLOSED`    closes the order for the token address after successful withdrawal
    /// @notice `_orderSwap[_securityToken][_swapID]._secretKey = _secretKey;` to update the secretKey value of the OrderSwap data for that ID
    
    function recipientWithdrawal(bytes32 _swapID, bytes32 _secretKey, address _securityToken) external {

        require(_swapState[_securityToken][_swapID] == OrderLibrary.SwapState.OPEN, "this order isn't opened");                                                     // this order must not be CLOSED, INVALID or EXPIRED. it must be opened
        require(block.timestamp < _orderSwap[_securityToken][_swapID]._expiration, "withdrawal expired");
        require(msg.sender == _orderSwap[_securityToken][_swapID]._investor, "invalid recipient");                       
        require(sha256(abi.encode(_secretKey)) == _orderSwap[_securityToken][_swapID]._secretHash, "invalid secret");                                               // the hash of the provided secret by the investor must match the hash in this order ID 
        OrderSwap memory _order = _orderSwap[_securityToken][_swapID];                                                                  // fetch the order data
        IERC1400(_orderSwap[_securityToken][_swapID]._ERC1400_ADDRESS).transferByPartition(_order._partition, _order._investor, _order._tokenValue, hex"00");           // the htlc contract releases the token to the investor
        _orderSwap[_securityToken][_swapID]._secretKey = _secretKey;                                                                    //  update the secretKey value to be publicly available on the on-chain
        _swapState[_securityToken][_swapID] = OrderLibrary.SwapState.CLOSED;                                                                         //  close the order
        emit ClosedOrder(_order._issuer, _order._investor, _securityToken, _order._swapID, _order._tokenValue, _secretKey, _order._secretHash, _order._partition);
        
    }


    /// @param _swapID is the id of the order to refunded to the issuer 
    /// @notice `_order._issuer` should be msg.sender
    /// @notice `_order._expiration` should be lesser than the current time.  In order words, the order has expired
    /// @notice `ERC1400_TOKEN.transferByPartition` refunds the issuer
    /// @notice `_swapState[_swapID] = OrderLibrary.SwapState.EXPIRED` sets the order's state to EXPIRED

    function refund(bytes32 _swapID, address _securityToken) external {

        OrderSwap memory _order = _orderSwap[_securityToken][_swapID];
        require(_order._issuer == msg.sender, "invalid caller");
        require(_swapState[_securityToken][_swapID] == OrderLibrary.SwapState.OPEN, "order is not opened");
        require(block.timestamp > _order._expiration, "the order is yet to expire"); 
        IERC1400(_orderSwap[_securityToken][_swapID]._ERC1400_ADDRESS).transferByPartition(_order._partition, msg.sender, _order._tokenValue, hex"00");
        _swapState[_securityToken][_swapID] = OrderLibrary.SwapState.EXPIRED;
        emit RefundOrder(msg.sender, _securityToken, _order._swapID, _order._tokenValue, _order._expiration, _order._partition);

    }



    /// @param _swapID is the id of the order to be fetched
    /// @notice `_swapID` must not be INVALID. it can be OPEN, CLOSED or EXPIRED. 

    function checkOrder(bytes32 _swapID, address _securityToken) external view returns (address _investor, address _issuer, address _securityTokenAddress, uint256 _amount, uint256 _expiration, bytes32 _partition, bytes32 _orderID, OrderLibrary.SwapState _orderState, bytes32 _secretKey) {

        require(_swapState[_securityToken][_swapID] != OrderLibrary.SwapState.INVALID, "invalid order");
        OrderSwap memory _order = _orderSwap[_securityToken][_swapID];
        OrderLibrary.SwapState _state = _swapState[_securityToken][_swapID];
        return (_order._investor, _order._issuer, _order._ERC1400_ADDRESS, _order._tokenValue, _order._expiration, _order._partition, _order._swapID, _state, _order._secretKey);

    }

   


    

    
    
    event OpenedOrder(address indexed _issuer, address indexed _investor, address indexed _securityToken, bytes32 _swapID, uint256 _amount, uint256 _expiration, bytes32 _secretHash, bytes32 _partition);
    event ClosedOrder(address indexed _issuer, address indexed _investor, address indexed _securityToken, bytes32 _swapID, uint256 _amount,bytes32 _secretKey, bytes32 _secretHash, bytes32 _partition);
    event RefundOrder(address indexed _to, address indexed _securityToken, bytes32 _swapID, uint256 _amount, uint256 _expiration, bytes32 _partition);

}