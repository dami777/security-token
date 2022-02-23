pragma solidity 0.8.10;


contract DecodeBytes{

    function encode() public pure returns (bytes memory) {
        return abi.encode("test");
    }

    function decode() public pure returns (string memory) {
        bytes memory data = encode();
        string memory value = abi.decode(data, (string));
        return value;
    }

    function encodeStruct(type name) {
        
    }

    function decodeStruct() {
        
    }

}