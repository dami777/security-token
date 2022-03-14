pragma solidity 0.8.10;



contract HTLC {


    /// @notice Contract for DVP. Seller discloses the preimage of the hash. Secret is exchanged for money over the block chain
    /// @notice Seller is permitted to spend the funds by disclosing the preimage of a hash
    /// @notice Buyer is permitted to spend the funds after a timeout is reached, in a refund situation
    /// @dev    HTLC enable atomic swap
    /// @dev    Buyer: entity that receives funds from seller once the seller reveals the secret
    /// @dev    Seller: entity that contributes funds to the buyer by revealing the secret or refunds after expiration



}