pragma solidity 0.8.10;


contract DecodeBytes{

    /* 
    
        The purpose of this contract is to illustrate how an encoded data can
        serve as a verification mechanism for transaction. This is just one of the
        possible ways apart from using a signature as a certificate for any transaction.

        With this method:

        1.  Deadline for transactions can be encoded into the certificate and will decoded in the respective functions
        2.  Any form of data that can be verified on the smart contract can be encoded into the certificate
    
    */


    struct Data {

        uint256 month;
        string name;

    }

    function encode() public pure returns (bytes memory) {
        return abi.encode("test");
    }

    function decode() public pure returns (string memory) {
        bytes memory data = encode();
        string memory value = abi.decode(data, (string));
        return value;
    }

    function encodeStruct(Data memory _data) public pure returns (bytes memory) {
        return abi.encode(_data.month, _data.name);
    }

    function decodeStruct(Data calldata _data) public pure returns (uint256, string memory) {
        bytes memory data = encodeStruct(_data);
        (uint256 _month, string memory _name) = abi.decode(data, (uint256, string));
        return (_month, _name);
    }

}