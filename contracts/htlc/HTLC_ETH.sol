/// @title  HTLC to release ETH from investor to issuer
/// @dev    Contract for DVP. Investor funds this contract with his ETH and gets the security token in exchange.

pragma solidity 0.8.10;

contract HTLC_ETH {

    mapping(bytes32 => OrderSwap) private _orderSwap;      //  map the order struct to the order ID
    //mapping(bytes32 => SwapState) private _swapState;      //  to keep track of the swap state of an id
    
    address _owner;

}