pragma solidity 0.8.10;

import "../htlc/HTLC_ETH.sol";


contract ReEntrancy {

    HTLC_ETH htlcEth;

    constructor(address _htlcEthAddress) {
        htlcEth = HTLC_ETH(_htlcEthAddress);
    }

    function attack(bytes32 _swapID, bytes32 _secretKey) external view returns (string memory) {
        //htlcEth.issuerWithdrawal(_swapID, _secretKey);
        return "okay";
    }
 
}