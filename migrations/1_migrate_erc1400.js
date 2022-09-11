const ERC1400 = artifacts.require("ERC1400");
const HTLC1400 = artifacts.require("HTLC1400");
const Certificate = artifacts.require("Certificate")
const OrderLibrary = artifacts.require("OrderLibrary")
const ERC20 = artifacts.require("ERC20");
const HTLC20 = artifacts.require("HTLC20");

const GenerateEthSignature = artifacts.require("GenerateEthSignature")
let classA = web3.utils.asciiToHex("CLASS A");
let classB = web3.utils.asciiToHex("CLASS B");

module.exports = async function (deployer) {


      // libray deployment

      await deployer.deploy(Certificate)
      await deployer.deploy(OrderLibrary)

      // link libraries before contract deployment

      await deployer.link(Certificate, ERC1400)


      await deployer.link(OrderLibrary, HTLC1400)
      await deployer.link(OrderLibrary, HTLC20)


      //  deploy the contracts

      await deployer.deploy(HTLC1400)
      await deployer.deploy(HTLC20)


      


      





 

};



