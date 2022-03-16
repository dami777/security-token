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



    IERC1400 public securityToken;

    mapping(bytes32 => OrderSwap) internal _orderSwap;      //  map the order to the secrete
    mapping(bytes32 => bool) internal _uniqueSecret;        //  ensure that the secret is unique on the blockchain


    struct OrderSwap{

        address _recipient;
        uint256 _tokenValue;
        uint256 _expiration;
        bytes32 _secretHash;
        bytes32 _partition;
        
    }

    constructor(address _securityToken) {

        securityToken = IERC1400(_securityToken);

    }

    /// @dev    when an order is opened, the issuer funds the contract with the token
    /// @param  _recipient is the target recipient/withdrawal of the deposited token
    /// @param  _tokenValue is the amount of token to be withdrawn by the investor
    /// @param  _expiration is the time the token withdrawal elasp. There will be a refund to the issuer's wallet if the token isn't withdrawn
    /// @param  _secretHash is the hash of the secret that must be provided by the recipient for the recipient to withdraw the security token
    /// @param  _partition is the partition where the token will be withdrawn into, in the investor's wallet

    function openOrder(address _recipient, uint256 _tokenValue, uint256 _expiration, bytes32 _secretHash, bytes32 _partition, bytes memory _data) external {

        require(!_uniqueSecret[_secretHash], "this secret has been used");
        _orderSwap[_secretHash] = OrderSwap(_recipient, _tokenValue, _expiration, _secretHash);         // save the order on the blockchain so that the target investor can make reference to it for withdrawal
        IERC1400(_securityToken).

    }

}