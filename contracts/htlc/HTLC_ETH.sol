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


    event OpenedOrder(address indexed _investor, bytes32 _swapID, bytes32 _partition, uint256 _amount, uint256 _price, uint256 _expiration, bytes32 _secretHash);
    event ClosedOrder(address indexed _investor, bytes32 _swapID, bytes32 _partition, uint256 _amount, uint256 _price, bytes32 _secretKey, bytes32 _secretHash);
    event RefundedOrder(address indexed _to, bytes32 _swapID, uint256 _amount, uint256 _expiration);
    event Funded(address indexed _investor, bytes32 _partition, uint256 _amount, uint256 _price);




}