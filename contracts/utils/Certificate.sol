pragma solidity 0.8.10;


contract Certificate {


    struct Holder {

        string firstName;
        string lastName;
        string location;
        address walletAddress;
        
        
    }


    struct TransferData {

        Holder from;
        Holder to;
        uint256 amount;

    }


    bytes32 private constant HOLDER_TYPED_HASH = keccak256("Holder(string firstName,string lastName,string location,address walletAddress)");
    bytes32 private constant TRANSFER_TYPED_HASH = keccak256("TransferData(Holder from,Holder to,uint256 amount)Holder(string firstName,string lastName,string location,address walletAddress)");
    address public returnedSigner;

   
    /// @notice this function generates hashes the domain separator for the signature
    /// @dev Enclose the strings in bytes during encoding
    /// @param verifyingContract The contract that will be used to verify the signatue
    /// @param version The version of the Dapp
    /// @param chainId The chain Id where the data will be signed
    /// @param salt An hardcoded byte32. One of the security measures for the signature

    function generateDomainSepartor (address verifyingContract, string memory version, uint256 chainId, bytes32 salt) internal view returns (bytes32) {

        bytes32 EIP712_DOMAIN_HASH_TYPE = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)");

        return keccak256(abi.encode(
            EIP712_DOMAIN_HASH_TYPE,
            keccak256(bytes("TANGL CAPITAL PARTNERS")),
            keccak256(bytes(version)),
            chainId,
            verifyingContract,
            salt
        ));
    }


    function hashHolder(Holder memory _holder) internal view returns (bytes32) {

        return keccak256(abi.encode(HOLDER_TYPED_HASH, keccak256(bytes(_holder.firstName)),  keccak256(bytes(_holder.lastName)), keccak256(bytes(_holder.location)), _holder.walletAddress));
        
    }



    /// @notice this function generates the signed signature prefixed with \x19\x01. The result will be used to verify the signer
    /// @param  _from The struct of the account to be debited
    /// @param  _to The struct of the account to be credited
    /// @dev    the hashHolder function hashes the _from and _to separately as they are different Holders entirely
    /// @return the prefixed hash

    function hashTransfer(Holder memory _from, Holder memory _to, uint256 _amount) public view returns (bytes32) {
        
        return keccak256(
            abi.encodePacked(
                "\x19\x01", 
                generateDomainSepartor(0x549f71200b5Ee3F3C04EF5A29e7c70d40E42ed83, "1", 1337, 0x54132a91a1bafcf3d90beaad0c0d5f0bda635715da5017e515739dbb823f282d),
                keccak256(abi.encode(
                    TRANSFER_TYPED_HASH,
                    hashHolder(_from),
                    hashHolder(_to),
                    _amount
                ))

            ));
    }



    /// @notice This function computes the r s v value of a signature
    /// @param _signature The data generated from the signed Typed data 
    /// @return r s v values
    

    function _split(bytes memory _signature) internal pure returns (bytes32 r, bytes32 s, uint8 v) {

        require(_signature.length == 65, "invalid signature length");

        assembly {

            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
           

        }

    }

    /// @notice verify the signer of a signature using the prefixed signed hash
    /// @param _signature The data generated from the signed Typed data 
    /// @param _ethHash The prefixed signature generated by the contract
    /// @return the address of the signer

    function verifySignature(bytes memory _signature, bytes32 _ethHash) public pure returns (address) {


            (bytes32 r, bytes32 s, uint8 v) = _split(_signature);
            address _signer = ecrecover(_ethHash, v, r, s);
            require(_signer != address(0), "signature failed");
            return address;

    }


    /// @notice decode the typed signature bytes data and the hash bytes32 data from the encoded data
    /// @param _encodedSignature The encoded data containing the signature and the signature hash 
    /// @return the signature and the hash

    function decodeData(bytes memory _encodedSignature) internal pure returns (bytes memory, bytes32) {
        return abi.decode(_encodedSignature, (bytes, bytes32));
    }

}