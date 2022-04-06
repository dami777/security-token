pragma solidity 0.8.10;

////      Just for testing purpose.

library LibraryTest {

    struct Holder {
        string name;
    }


    function add(string memory _word) internal view returns(string memory) {
        return _word;
    }

    function test(string memory _data) external view returns(string memory) {
        return add(_data);
    }

    function testStruct(bytes memory _holder) external view returns(bytes memory) {
        return _holder;
    }

    function verifySignature(bytes memory _signature, bytes32 _ethHash) external pure returns (address) {


        //(bytes32 r, bytes32 s, uint8 v) = _split(_signature);
        bytes32 r;
        bytes32 s;
        uint8 v;


        require(_signature.length == 65, "0x5f"); // invalid signature length

        assembly {

            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
           

        }

        require (ecrecover(_ethHash, v, r, s) != address(0), "0x59"); // invalid signer
        return ecrecover(_ethHash, v, r, s);

    }

    function decodeData(bytes memory _encodedSignature) external pure returns (bytes memory, bytes32, bool, bool) {
        return abi.decode(_encodedSignature, (bytes, bytes32, bool, bool));
    }


}

contract CallLibrary {


    function callString(string memory _word) external view returns (string memory) {
        return LibraryTest.test(_word);
    }

    function verify(bytes memory _signature, bytes32 _ethHash) external pure returns (address) {
        return LibraryTest.verifySignature(_signature, _ethHash);
    }



}