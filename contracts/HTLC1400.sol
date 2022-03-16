pragma solidity 0.8.10;

import "./utils/IERC1400.sol";


/// @title HTLC to release security from issuer to investor 

contract HTLC1400 {


    /// @notice Contract for DVP. Seller discloses the preimage of the hash. Secret is exchanged for money over the block chain
    /// @notice Seller is permitted to spend the funds by disclosing the preimage of a hash
    /// @notice Buyer is permitted to spend the funds after a timeout is reached, in a refund situation
    /// @dev    HTLC enable atomic swap
    /// @dev    Buyer: entity that receives funds from seller once the seller reveals the secret
    /// @dev    Seller: entity that contributes funds to the buyer by revealing the secret or refunds after expiration
    /// @dev    Secret: random number chosen by the seller revealed to allow the buyer to redeem the funds
    /// @dev    Secret Hash: hash of the secret. used in the construction of the HTLC
    /// @dev    Expiration: timestamp that determines when seller and buyer can redeem




    /// issuer funds the HTLC1400
    /// He enters the secret and withdraws the ether token
    /// the investor gets the know the secret and withdraws the security token
    /// incase of refund, implement timelock



    IERC1400 securityToken;

    constructor(address _securityToken) {

        securityToken = IERC1400(_securityToken);

    }
    
    function fund() external{

    }

    function withDraw() external {

    }

    function refund() external {
        
    }

}