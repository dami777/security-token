pragma solidity 0.8.10;

contract EIP712 {

    //  EIP712 standard for signing a structured data

    struct Identitty {

        address _from;
        address _to;
        uint256 _amount;

    }

    string constant IDENTITY_TYPE = "Identity(address _from, address _to, uint256 _amount)";


    // ******* Define the Domain Separator Values ****** //

    uint256 chainId = 5777;
    address verifyingContract = address(this);
    bytes32 salt = 0x54132a91a1bafcf3d90beaad0c0d5f0bda635715da5017e515739dbb823f282d;
    string EIP712_DOMAIN = "EIP712Domain(string name, string version, uint256 chainId, address verifyingContract, bytes32 salt)";

    


}

