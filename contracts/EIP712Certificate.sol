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

    uint256 constant chainId = 5777;
    address verifyingContract = address(this);
    bytes32 constant salt = 0x54132a91a1bafcf3d90beaad0c0d5f0bda635715da5017e515739dbb823f282d;      // an hardcoded salt value
    string constant EIP712_DOMAIN_HASH_TYPE = "EIP712Domain(string name, string version, uint256 chainId, address verifyingContract, bytes32 salt)";


    bytes32 constant DOMAIN_SEPARATOR = keccak256(abi.encodePacked(

        EIP712_DOMAIN_HASH_TYPE,
        keccak256(bytes("Dapp Name")),
        keccak256(bytes("1")),
        chainId,
        verifyingContract,
        salt

    ));

    function hashIdentity(Identitty memory _identity) public pure returns (bytes32) {

        return keccak256(abi.encodePacked(_identity._from, _identity._to, _identity._amount));

    }




}

