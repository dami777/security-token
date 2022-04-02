/// @title  HTLC to release ETH from investor to issuer
/// @dev    Contract for DVP. Investor funds this contract with his ETH and gets the security token in exchange.

pragma solidity 0.8.10;

import "../utils/OrderLibrary.sol";

contract HTLC_ETH {


    fallback () external {

    }

    address private _owner;

    constructor () {

        _owner = msg.sender

    }



}