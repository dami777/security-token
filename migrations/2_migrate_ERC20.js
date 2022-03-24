
const ERC20 = artifacts.require("ERC20");
const HTLC20 = artifacts.require("HTLC20");

module.exports = function (deployer) {
  
  deployer.deploy(ERC20, "US Dollar Tether", "USDT").then(

    ()=>deployer.deploy(HTLC20, ERC20.address)

  )

  
  
};
