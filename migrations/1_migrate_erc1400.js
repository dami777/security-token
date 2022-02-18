const Erc1400 = artifacts.require("ERC1400");
const EIP712 = artifacts.require("EIP712");
let classA = web3.utils.asciiToHex("CLASS A")
let classB = web3.utils.asciiToHex("CLASS B")

module.exports = function (deployer) {
  deployer.deploy(Erc1400, "TANGLE", "TAN", 18, 0, [classA, classB]);
  //deployer.deploy(EIP712)
};
