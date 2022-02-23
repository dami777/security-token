pragma solidity 0.8.10;

contract EIP712 {

    //  EIP712 standard for signing a structured data



    struct Identity {

        string _from;
        //string _to;
        uint256 _amount;

    }

    address public returnedSigner;
    

    

    bytes32 constant IDENTITY_TYPEHASH = keccak256("Identity(string _from,uint256 _amount)");


    // ******* Define the Domain Separator Values ****** //

    uint256 constant chainId = 4;
    address verifyingContract = 0x549f71200b5Ee3F3C04EF5A29e7c70d40E42ed83; // an hardcoded contract address
    bytes32 constant salt = 0x54132a91a1bafcf3d90beaad0c0d5f0bda635715da5017e515739dbb823f282d;      // an hardcoded salt value
    bytes32 constant EIP712_DOMAIN_HASH_TYPE = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)");

    bytes32 public _ethHash;

    bytes32 DOMAIN_SEPARATOR = keccak256(abi.encode(

        EIP712_DOMAIN_HASH_TYPE,
        keccak256(bytes("TANGL")),
        keccak256(bytes("1")),
        chainId,
        verifyingContract,
        salt

    ));

    // function to hash the Identity data

    function hashIdentity(Identity memory _identity) public pure returns (bytes32) {
 

        return keccak256(abi.encode(IDENTITY_TYPEHASH, keccak256(bytes(_identity._from)),  _identity._amount));

    }


    // function to hash the hashed Identity

    function ethHash(Identity memory _identity) public returns (bytes32) {
        
        _ethHash =  keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hashIdentity(_identity)));

        return _ethHash;
    }
    

    // recover function

    function _split(bytes memory _signature) public returns (bytes32 r, bytes32 s, uint8 v) {

        require(_signature.length == 65, "invalid signature length");

        assembly {

            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
           

        }

    }

    // verify the signer using the ethereum signed hash and the signature

    function verifySignature(bytes memory _signature) public returns (address) {


            (bytes32 r, bytes32 s, uint8 v) = _split(_signature);

            returnedSigner = ecrecover(_ethHash, v, r, s);

    }

    function chainID() external view returns (uint256) {

        uint256 id;
        assembly {
            id := chainid()
        }

        return id;

    }

    





}

