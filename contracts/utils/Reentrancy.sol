pragma solidity 0.8.10;

import "../htlc/HTLC_ETH.sol";


contract ReEntrancy {

    HTLC_ETH htlcEth;

    constructor(address _htlcEth) {
        htlcEth = HTLC_ETH(_htlcEth);
    }

    function attack(bytes32 _swapID, bytes32 _secretKey) external payable {
        htlcEth.issuerWithdrawal(_swapID, _secretKey);
    }
 
}