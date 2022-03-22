/// @title  HTLC to release USDT from investor to issuer
/// @dev    Contract for DVP. Investor funds this contract with his usdt and gets the security token in exchange.

pragma solidity 0.8.10;

import "../utils/IERC20.sol";


contract HTLC20 {


    mapping(bytes32 => OrderSwap) private _orderSwap;      //  map the order struct to the order ID
    mapping(bytes32 => SwapState) private _swapState;      //  to keep track of the swap state of an id
    address _owner;

    IERC20 ERC20_TOKEN;

    struct OrderSwap {

        
        address _recipient;
        address _investor;
        uint256 _tokenValue;
        uint256 _expiration;
        bytes32 _secretHash;
        bytes32 _secretKey;
        bytes32 _swapID;
        bool _funded;
        
    }


    enum SwapState {

        INVALID,
        OPEN,
        CLOSED,
        EXPIRED

    }

    constructor(address _usdtAddress) {

        ERC20_TOKEN = IERC20(_usdtAddress);
        _owner = msg.sender;

    }

    /// @dev    Issuer initializes the order with the same orderID in the htlc1400 contract
    /// @dev    The issuer uses the ID to withdraw USDT from this contract, while the investor uses the ID to withdraw from the htlc1400 contract
    /// @param  _swapID is the ID of the swap order. This ID must be valid on the htlc1400 contract for swap to occur
    /// @param _investor is the address that will fund this contract with the given _swapID
    /// @param  _tokenValue is the amount to be funded by investor for this particular order
    /// @param _expiration is the time expected for this order to expire before a refund can enabled
    /// @param _secretHash is the hash of the secret set on this contract and htlc1400 for this particular swap ID

    function createOrder(bytes32 _swapID, address _investor, uint256 _price, uint256 _expiration, bytes32 _secretHash) {

        require(msg.sender == _owner, "invalid caller");
        _orderSwap[_swapID] = OrderSwap(msg.sender, _investor, _price, _expiration, _secretHash, bytes(0), _swapID, false);
        _swapState[_swapID] = SwapState.OPEN;
        emit OpenedOrder(_investor, _swapID, _price, expiration, _secretHash);

    }

    function fundOrder() {

    }

    /*function issuerWithdrawal() {

    }*/

    event OpenedOrder(address indexed _investor, bytes32 _swapID, uint256 _amount, uint256 _expiration, bytes32 _secretHash);
    event ClosedOrder(address indexed _investor, bytes32 _swapID, uint256 _amount,bytes32 _secretKey, bytes32 _secretHash);
    event RefundOrder(address indexed _to, bytes32 _swapID, uint256 _amount, uint256 _expiration);

}