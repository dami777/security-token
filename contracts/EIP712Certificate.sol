pragma solidity 0.8.10;

contract EIP712 {

    //  EIP712 standard for signing a structured data

    struct Identitty {

        address _from;
        address _to;
        uint256 _amount;

    }

    string constant IDENTITY_TYPE = "Identity(address _from, address _to, uint256 _amount)";


}

