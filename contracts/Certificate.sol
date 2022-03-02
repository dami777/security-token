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

    }

    /*function generateHash () {

    }


    function generatePrefixedHash () {

    }*/

}