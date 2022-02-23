pragma solidity 0.8.10;


contract DecodeBytes{


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

    function encodeStruct(Data calldata _data) public pure returns (bytes memory) {
        return abi.encode(_data.month, _data.name);
    }

    function decodeStruct() {

    }

}