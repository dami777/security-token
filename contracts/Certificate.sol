pragma solidity 0.8.10;




contract Certificate {

    //  this contract is to test data signing
    //  steps:

    //  1. Have the message (structured data should be EIP 712 standard)
    //  2. Hash the Message
    //  3. Generate another hash of the hash message in 3
    //  4. Sign the hashed message offchain
    //  5. Verify the signature


    function generateMessageHash(string memory _message) public returns (bytes32) {

        return keccak256(abi.encodePacked(_message);)

    }

    function generateHashToSign(bytes32 _hashedMessage) public returns (bytes32) {

        return keccak256(abi.encodePacked(
            "x19Ethereum Signed Message:\n32",
            _hashedMessage
        ));

    }

    function verifySignature() {

    }


}