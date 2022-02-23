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

    function encodeStruct(Data memory _data) public pure returns (bytes memory) {
        return abi.encode(_data.month, _data.name);
    }

    function decodeStruct(Data calldata _data) public pure returns (uint256, string memory) {
        bytes memory data = encodeStruct(_data);
        (uint256 _month, string memory _name) = abi.decode(data);
        return (_month, _name);
    }

}