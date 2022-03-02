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
    /// @param  // first argument takes the struct of the _from address, second argument takes the struct of the destination address
    /// @dev    the hashPerson function hashes the _from and _to separately as they are different Persons entirely

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

}