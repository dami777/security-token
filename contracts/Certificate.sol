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


    bytes32 private constant PERSON_TYPED_HASH = keccak256("Person(string firstName, string lastName, string location, walletAddress)");
    bytes32 private constant TRANSFER_TYPED_HASH = keccak256("Transfer(Person from, Person to, uint256 amount)Person(string firstName, string lastName, string location, walletAddress)");


    /*function generateHash () {

    }


    function generatePrefixedHash () {

    }*/

}