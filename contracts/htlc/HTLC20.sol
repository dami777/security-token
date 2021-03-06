/// @title  HTLC to release USDT from investor to issuer
/// @dev    Contract for DVP. Investor funds this contract with his usdt and gets the security token in exchange.

pragma solidity 0.8.10;

//  SPDX-License-Identifier: UNLICENSED

import "../utils/IERC20.sol";
import "../utils/OrderLibrary.sol";


contract HTLC20 {


    //using OrderLibrary for OrderLibrary.SwapState;
    //using OrderLibrary for OrderLibrary.OrderSwap;

    mapping(address => mapping(bytes32 => OrderLibrary.OrderSwap)) private _orderSwap;      //  map the order struct to the order ID
    mapping(address => mapping(bytes32 => OrderLibrary.SwapState)) private _swapState;      //  to keep track of the swap state of an id
    
    address private  _owner;



    /// @dev    Issuer initializes the order with the same orderID in the htlc1400 contract
    /// @dev    The issuer uses the ID to withdraw USDT from this contract, while the investor uses the ID to withdraw from the htlc1400 contract
    /// @param  _swapID is the ID of the swap order. This ID must be valid on the htlc1400 contract for swap to occur
    /// @param _investor is the address that will fund this contract with the given _swapID
    /// @param  _price is the set price of the security token to be purchased. This contract is funded by investor for this particular order
    /// @param _expiration is the time expected for this order to expire before a refund can enabled
    /// @param _secretHash is the hash of the secret set on this contract and htlc1400 for this particular swap ID

    function openOrder(bytes32 _swapID, address _investor, address _erc20, address _securityToken, uint256 _price, uint256 _amount, uint256 _expiration, bytes32 _secretHash, bytes32 _secretKey, bytes32 _partition) external {

        require(_swapState[_securityToken][_swapID] == OrderLibrary.SwapState.INVALID, "existing id");
        require( _secretHash == sha256(abi.encode(_secretKey)), "invalid secret");
        require(_expiration > block.timestamp, "expiration time is less than present time");
        _orderSwap[_securityToken][_swapID] = OrderLibrary.OrderSwap(msg.sender, _investor, _erc20, _securityToken, _price, _amount, _expiration, _secretHash, bytes32(0), _swapID, _partition, false);
        _swapState[_securityToken][_swapID] = OrderLibrary.SwapState.OPEN;
        emit OpenedOrder(msg.sender, _investor, _securityToken, _swapID, _partition, _amount, _price, _expiration, _secretHash);

    }


    /// @param _swapID is the id of the order to be funded
    /// @notice `_orderSwap[_swapID]._funded == false`, i.e the order must not be funded yet
    /// @notice `_swapState[_swapID] == OrderLibrary.SwapState.OPEN` ,  i.e the order state must be opened
    /// @dev this contract must be approved by the caller before calling this function

    function fundOrder(bytes32 _swapID, address _securityToken) external {

        require(_swapState[_securityToken][_swapID] == OrderLibrary.SwapState.OPEN, "not opened");
        require(_orderSwap[_securityToken][_swapID]._funded == false, "funded order");
        require(_orderSwap[_securityToken][_swapID]._investor == msg.sender, "invalid caller");
        require(_orderSwap[_securityToken][_swapID]._expiration > block.timestamp, "can't fund expired order");
        OrderLibrary.OrderSwap memory _order = _orderSwap[_securityToken][_swapID];
        IERC20(_order._paymentAddress).transferFrom(_order._investor, address(this), _order._price);
        _orderSwap[_securityToken][_swapID]._funded = true;
        emit Funded(_order._investor, _order._ERC1400_ADDRESS, _order._partition, _order._amount, _order._price);

    }


    /// @param _swapID is the id of the order to withdrawn the usdt from
    /// @param _secretKey is the secret the issuer must provide and reveal to the investor. The investor will in turn use this secret to withdraw the security token from the htlc1400 contract
    /// @notice the caller is the owner of the contract
    /// @notice the order must be OPEN
    /// @notice the order must not be an expired order
    /// @notice the hash of the secretKey must equal the hash in the order

    function issuerWithdrawal(bytes32 _swapID, bytes32 _secretKey, address _securityToken) external {

        require(_swapState[_securityToken][_swapID] == OrderLibrary.SwapState.OPEN, "not opened");
        require(_orderSwap[_securityToken][_swapID]._issuer == msg.sender, "invalid caller");
        require(_orderSwap[_securityToken][_swapID]._funded == true, "not funded");
        OrderLibrary.OrderSwap memory _order = _orderSwap[_securityToken][_swapID];
        require(block.timestamp < _order._expiration, "expired order");
        require(sha256(abi.encode(_secretKey)) == _order._secretHash, "invalid secret"); 
        IERC20(_order._paymentAddress).transfer(_order._issuer, _order._price);
        _orderSwap[_securityToken][_swapID]._secretKey = _secretKey;
        _swapState[_securityToken][_swapID] = OrderLibrary.SwapState.CLOSED;
        emit ClosedOrder(_order._issuer, _order._investor, _order._ERC1400_ADDRESS, _swapID, _order._partition, _order._amount, _order._price, _order._secretKey, _order._secretHash);

    }

    /// @param _swapID is the order ID of the order to be refunded
    /// @notice `block.timestamp ` > `expiration time`
    /// @notice swapt state becomes `expired`


    function refund(bytes32 _swapID, address _securityToken) external {

        require(_orderSwap[_securityToken][_swapID]._investor == msg.sender, "invalid caller");
        require(_swapState[_securityToken][_swapID] == OrderLibrary.SwapState.OPEN, "not opened");
        require(_orderSwap[_securityToken][_swapID]._funded == true, "not funded");
        require(block.timestamp > _orderSwap[_securityToken][_swapID]._expiration, "not expired");    
        OrderLibrary.OrderSwap memory _order = _orderSwap[_securityToken][_swapID];
        IERC20(_order._paymentAddress).transfer(_order._investor, _order._price);
        _swapState[_securityToken][_swapID] = OrderLibrary.SwapState.EXPIRED;
        emit RefundedOrder(_order._issuer, _order._investor, _order._ERC1400_ADDRESS ,_swapID, _order._price, _order._expiration);

    }


    /// @param _swapID is the id of the order to be fetched
    /// @notice `_swapID` must not be INVALID. it can be OPEN, CLOSED or EXPIRED. 

    function checkOrder(bytes32 _swapID, address _securityToken) external view returns (address _issuer, address _investor, address _securityTokenAddress, uint256 _amount, uint256 _expiration, bool _funded, bytes32 _orderID, OrderLibrary.SwapState _orderState, bytes32 _secretKey) {

        require(_swapState[_securityToken][_swapID] != OrderLibrary.SwapState.INVALID, "invalid order");
        OrderLibrary.OrderSwap memory _order = _orderSwap[_securityToken][_swapID];
        OrderLibrary.SwapState _state = _swapState[_securityToken][_swapID];
        return (_order._issuer, _order._investor, _order._ERC1400_ADDRESS ,_order._price, _order._expiration, _order._funded, _order._swapID, _state, _order._secretKey);

    }




    event OpenedOrder(address indexed _issuer, address indexed _investor, address indexed _securityToken, bytes32 _swapID, bytes32 _partition, uint256 _amount, uint256 _price, uint256 _expiration, bytes32 _secretHash);
    event ClosedOrder(address indexed _issuer, address indexed _investor, address indexed _securityToken, bytes32 _swapID, bytes32 _partition, uint256 _amount, uint256 _price, bytes32 _secretKey, bytes32 _secretHash);
    event RefundedOrder(address indexed _issuer, address indexed _investor, address indexed _securityToken, bytes32 _swapID, uint256 _amount, uint256 _expiration);
    event Funded(address indexed _investor, address indexed _securityToken, bytes32 _partition, uint256 _amount, uint256 _price);

}