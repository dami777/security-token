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
    /// @dev Explain to a developer any extra details

    function generateDomainSepartor (address verifyingContract, string version, uint256 chainId, bytes32 salt) internal view returns (bytes32) {

        bytes32 EIP712_DOMAIN_HASH_TYPE = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)");

        return keccak256(abi.encode(
            EIP712_DOMAIN_HASH_TYPE,
            keccak256(bytes("TANGL CAPITAL PARTNERS")),
            keccak256(bytes(version)),
            chainId,
            verifyingContract,
            salt
        ))
    }


    function generatePersonHash(Person memory _person) internal view returns (bytes32) {

        return keccak256(abi.encode(PERSON_TYPED_HASH, keccak256(bytes(_person.firstName, _person.lastName, _person.location, _person.walletAddress))));
        
    }


    /*function generatePrefixedHash () {

    }*/

}