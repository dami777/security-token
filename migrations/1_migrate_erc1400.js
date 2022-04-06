const ERC1400 = artifacts.require("ERC1400");
const HTLC1400 = artifacts.require("HTLC1400");
const Certificate = artifacts.require("Certificate")
const GenerateEthSignature = artifacts.require("GenerateEthSignature")
let classA = web3.utils.asciiToHex("CLASS A");
let classB = web3.utils.asciiToHex("CLASS B");

module.exports = function (deployer) {

  deployer.deploy(Certificate).then(
    () => {
      deployer.link(Certificate, ERC1400)
      deployer.link(Certificate, GenerateEthSignature)
      deployer.deploy(GenerateEthSignature)
      
      deployer.deploy(ERC1400, "TANGLE", "TAN", 18, 0, [classA, classB]).then(

        ()=>deployer.deploy(HTLC1400, ERC1400.address)
    
      )
    }
  )
  
 

};



