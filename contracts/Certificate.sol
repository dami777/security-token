pragma solidity 0.8.10;




contract Certificate {

    //  this contract is to test data signing
    //  steps:

    //  1. Have the message (structured data should be EIP 712 standard)
    //  2. Hash the Message
    //  3. Sign the hashed Message
    //  4. Hash the signed message
    //  5. Verify the signer using the signature hash and the signature


    bytes32 public messageToSign;
    bytes32 public hashedSignature;
    address public returnedSigner;

    function generateMessageHash(string memory _message) public returns (bytes32) {


        messageToSign = keccak256(abi.encodePacked(_message));
        return messageToSign;

    }

    function generateEthSignHash(bytes32 _signedData) public returns (bytes32) {

        hashedSignature =  keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            _signedData
        ));

        return hashedSignature;

    }


    function _split(bytes memory _signature) public returns (bytes32 r, bytes32 s, uint8 v) {

        require(_signature.length == 65, "invalid signature length");

        assembly {

            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))

        }

    }

    function verifySignature(bytes32 _hashedSignature, bytes memory _signature) public returns (address) {

            (bytes32 r, bytes32 s, uint8 v) = _split(_signature);

            returnedSigner = ecrecover(_hashedSignature, v, r, s);

    }


}