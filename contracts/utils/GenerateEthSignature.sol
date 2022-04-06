pragma solidity 0.8.10;

import "./CertificateLibrary.sol";

contract GenerateEthSignature {

    /// @dev    This function generates a bytes32 prefixed signature that will be used to verify the signed Typed Data Signature

    function generateEthSignature(address _verifyingContract, string memory _version, string memory _companyName, uint256 _chainID, bytes32 _salt, Certificate.Holder memory _from, Certificate.Holder memory _to, uint256 _amount) external view returns (bytes32) {
        
        return Certificate.hashTransfer(_verifyingContract, _version, _companyName, _chainId, _salt, _from, _to, _amount);

    }

}