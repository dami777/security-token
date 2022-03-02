pragma solidity 0.8.10;


contract Certificate {


    struct Person {

        string firstName;
        string lastName;
        string location;
        address walletAddress;
        
        
    }


    struct Transfer {

        Person from;
        Person to;
        uint256 amount;

    }


    bytes32 private constant PERSON_TYPED_HASH = keccak256("Person(string firstName,string lastName,string location,address walletAddress)");
    bytes32 private constant TRANSFER_TYPED_HASH = keccak256("Transfer(Person from,Person to,uint256 amount)Person(string firstName,string lastName,string location,address walletAddress)");


   
    /// @notice this function generates the domain separator for the signature
    /// @dev Enclose the strings in bytes during encoding

    function generateDomainSepartor (address verifyingContract, string memory version, uint256 chainId, bytes32 salt) internal view returns (bytes32) {

        bytes32 EIP712_DOMAIN_HASH_TYPE = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)");

        return keccak256(abi.encode(
            EIP712_DOMAIN_HASH_TYPE,
            keccak256(bytes("TANGL CAPITAL PARTNERS")),
            keccak256(bytes(version)),
            chainId,
            verifyingContract,
            salt
        ));
    }


    function hashPerson(Person memory _person) internal view returns (bytes32) {

        return keccak256(abi.encode(PERSON_TYPED_HASH, keccak256(bytes(_person.firstName)),  keccak256(bytes(_person.lastName)), keccak256(bytes(_person.location)), _person.walletAddress));
        
    }



    /// @notice this function generates the signed signature prefixed with \x19\x01. The result will be used to verify the signer
    /// @param  _from The struct of the account to be debited
    /// @param  _to The struct of the account to be credited
    /// @dev    the hashPerson function hashes the _from and _to separately as they are different Persons entirely
    /// @return the prefixed hash

    function hashTransfer(Person memory _from, Person memory _to, uint256 _amount) public view returns (bytes32) {
        
        return keccak256(
            abi.encodePacked(
                "\x19\x01", 
                generateDomainSepartor(0x549f71200b5Ee3F3C04EF5A29e7c70d40E42ed83, "1", 1337, 0x54132a91a1bafcf3d90beaad0c0d5f0bda635715da5017e515739dbb823f282d),
                keccak256(abi.encode(
                    TRANSFER_TYPED_HASH,
                    hashPerson(_from),
                    hashPerson(_to),
                    _amount
                ))

            ));
    }



    /// @notice This function computes the r s v value of a signature
    /// @param _signature The data generated from the signed Typed data 
    /// @return r s v values
    

    function _split(bytes memory _signature) internal returns (bytes32 r, bytes32 s, uint8 v) {

        require(_signature.length == 65, "invalid signature length");

        assembly {

            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
           

        }

    }

    ///  verify the signer using the ethereum signed hash and the signature

    function verifySignature(bytes memory _signature, bytes32 _ethHash) external returns (address) {

            
            (bytes32 r, bytes32 s, uint8 v) = _split(_signature);

            return ecrecover(_ethHash, v, r, s);

    }

}