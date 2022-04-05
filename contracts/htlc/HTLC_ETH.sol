/// @title  HTLC to release ETH from investor to issuer
/// @dev    Contract for DVP. Investor funds this contract with his ETH and gets the security token in exchange.

pragma solidity 0.8.10;

import "../utils/OrderLibrary.sol";

contract HTLC_ETH {


   fallback () external {

    }

    address private _owner;

    mapping(bytes32 => OrderLibrary.OrderSwap) private _orderSwap;      //  map the order struct to the order ID
    mapping(bytes32 => OrderLibrary.SwapState) private _swapState;      //  to keep track of the swap state of an id
    bool private locked;                                                //  boolean variable used to handle reEntrancy
                                                    
    
    /// @notice locked = true
    /// @dev    when an attacker calls the withdraw or refund function, the function is set to locked. It will only be unlocked when the function runs to the end
    /// @dev    locked = false after the withdraw or refund function finishes executing

    modifier noReEntrancy() {

        require(!locked, "no re-entrancy");
        locked = true;
        _;
        locked = false;
    }

    constructor () {

        _owner = msg.sender;

    }

    /// @dev    Issuer initializes the order with the same orderID in the htlc1400 contract
    /// @dev    The issuer uses the ID to withdraw USDT from this contract, while the investor uses the ID to withdraw from the htlc1400 contract
    /// @param  _swapID is the ID of the swap order. This ID must be valid on the htlc1400 contract for swap to occur
    /// @param _investor is the address that will fund this contract with the given _swapID
    /// @param  _price is the price of the security token to be purchased. This contract is funded by investor for this particular order
    /// @param _expiration is the time expected for this order to expire before a refund can enabled
    /// @param _secretHash is the hash of the secret set on this contract and htlc1400 for this particular swap ID

    function openOrder(bytes32 _swapID, address _investor, uint256 _price, uint256 _amount, uint256 _expiration, bytes32 _secretHash, bytes32 _secretKey, bytes32 _partition) external {

        require(msg.sender == _owner, "invalid caller");
        require(_swapState[_swapID] == OrderLibrary.SwapState.INVALID, "this order id exist already");
        require( _secretHash == sha256(abi.encode(_secretKey)), "the secret doesn't match the hash");
        _orderSwap[_swapID] = OrderLibrary.OrderSwap(msg.sender, _investor, _price, _amount, _expiration, _secretHash, bytes32(0), _swapID, _partition, false);
        _swapState[_swapID] = OrderLibrary.SwapState.OPEN;
        emit OpenedOrder(_investor, _swapID, _partition, _amount, _price, _expiration, _secretHash);

    }


    /// @param _swapID is the id of the order to be funded
    /// @notice `_orderSwap[_swapID]._funded == false`, i.e the order must not be funded yet
    /// @notice `_swapState[_swapID] == OrderLibrary.SwapState.OPEN` ,  i.e the order state must be opened
    /// @dev this contract must be approved by the caller before calling this function

    function fundOrder(bytes32 _swapID) payable external {

        require(_swapState[_swapID] == OrderLibrary.SwapState.OPEN, "this order isn't opened");
        require(_orderSwap[_swapID]._funded == false, "this order has been funded");
        require(_orderSwap[_swapID]._investor == msg.sender, "invalid caller");
        require(_orderSwap[_swapID]._price == msg.value, "invalid amount");
        OrderLibrary.OrderSwap memory _order = _orderSwap[_swapID];
        _orderSwap[_swapID]._funded = true;
        emit Funded(_order._investor, _order._partition, _order._amount, _order._price);

    }


    /// @param _swapID is the id of the order to withdrawn the usdt from
    /// @param _secretKey is the secret the issuer must provide and reveal to the investor. The investor will in turn use this secret to withdraw the security token from the htlc1400 contract
    /// @notice the caller is the owner of the contract
    /// @notice the order must be OPEN
    /// @notice the order must not be an expired order
    /// @notice the hash of the secretKey must equal the hash in the order

    function issuerWithdrawal(bytes32 _swapID, bytes32 _secretKey) external noReEntrancy {

        require(msg.sender == _owner, "invalid caller");
        require(_swapState[_swapID] == OrderLibrary.SwapState.OPEN, "must be an opened order");
        require(_orderSwap[_swapID]._funded == true, "this order has not been funded");
        OrderLibrary.OrderSwap memory _order = _orderSwap[_swapID];
        require(block.timestamp < _order._expiration, "order has expired");
        require(sha256(abi.encode(_secretKey)) == _order._secretHash, "invalid secret"); 
        (bool sent, ) = payable(msg.sender).call{value: _order._price}("");
        require(sent, "Failed to release Ether");
        _orderSwap[_swapID]._secretKey = _secretKey;
        _swapState[_swapID] = OrderLibrary.SwapState.CLOSED;
        emit ClosedOrder(_order._investor, _swapID, _order._partition, _order._amount, _order._price, _order._secretKey, _order._secretHash);

    }


    /// @param _swapID is the order ID of the order to be refunded
    /// @notice `block.timestamp ` > `expiration time`
    /// @notice swapt state becomes `expired`


    function refund(bytes32 _swapID) external {

        require(_swapState[_swapID] == OrderLibrary.SwapState.OPEN, "order is not opened");
        require(block.timestamp > _orderSwap[_swapID]._expiration, "order has not expired");
        require(_orderSwap[_swapID]._funded == true, "this order was not funded");
        OrderLibrary.OrderSwap memory _order = _orderSwap[_swapID];
        (bool sent, ) = payable(msg.sender).call{value: _order._price}("");
        require(sent, "Failed to release Ether");
        _swapState[_swapID] = OrderLibrary.SwapState.EXPIRED;
        emit RefundedOrder(_order._investor, _swapID, _order._price, _order._expiration);

    }



    /// @param _swapID is the id of the order to be fetched
    /// @notice `_swapID` must not be INVALID. it can be OPEN, CLOSED or EXPIRED. 

    function checkOrder(bytes32 _swapID) external view returns (address _recipient, address _investor, uint256 _amount, uint256 _expiration, bool _funded, bytes32 _orderID, OrderLibrary.SwapState _orderState, bytes32 _secretKey) {

        require(_swapState[_swapID] != OrderLibrary.SwapState.INVALID, "invalid order");
        OrderLibrary.OrderSwap memory _order = _orderSwap[_swapID];
        OrderLibrary.SwapState _state = _swapState[_swapID];
        return (_order._recipient, _order._investor, _order._price, _order._expiration, _order._funded, _swapID, _state, _order._secretKey);

    }

    

    event OpenedOrder(address indexed _investor, bytes32 _swapID, bytes32 _partition, uint256 _amount, uint256 _price, uint256 _expiration, bytes32 _secretHash);
    event ClosedOrder(address indexed _investor, bytes32 _swapID, bytes32 _partition, uint256 _amount, uint256 _price, bytes32 _secretKey, bytes32 _secretHash);
    event RefundedOrder(address indexed _to, bytes32 _swapID, uint256 _amount, uint256 _expiration);
    event Funded(address indexed _investor, bytes32 _partition, uint256 _amount, uint256 _price);




}