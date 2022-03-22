/// @title  HTLC to release USDT from investor to issuer
/// @dev    Contract for DVP. Investor funds this contract with his usdt and gets the security token in exchange.

pragma solidity 0.8.10;

import "../utils/IERC20.sol";

contract HTLC20 {


    mapping(bytes32 => OrderSwap) private _orderSwap;      //  map the order struct to the order ID
    mapping(bytes32 => SwapState) private _swapState;      //  to keep track of the swap state of an id


    IERC20 ERC20_TOKEN;

    struct OrderSwap {

        
        address _recipient;
        address _issuer;
        uint256 _tokenValue;
        uint256 _expiration;
        bytes32 _secretHash;
        bytes32 _secretKey;
        bytes32 _partition;
        bytes32 _swapID;
        
    }


    enum SwapState {

        INVALID,
        OPEN,
        CLOSED,
        EXPIRED

    }

}