const Erc1400 = artifacts.require("ERC1400");

module.exports = function (deployer) {
  deployer.deploy(Erc1400, "TANGLE", "TAN", 18, 0);
};
