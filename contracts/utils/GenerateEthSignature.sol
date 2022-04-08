pragma solidity 0.8.10;

import "./CertificateLibrary.sol";

contract GenerateEthSignature {

    /// @dev    This function generates a bytes32 prefixed signature that will be used to verify the signed Typed Data Signature

    function generateEthSignature(Certificate.DomainData memory _domainData, Certificate.Holder memory _from, Certificate.Holder memory _to, uint256 _amount) external pure returns (bytes32) {
        
        return Certificate.hashTransfer(_domainData, _from, _to, _amount);

    }

}