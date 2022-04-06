const LibraryTest = artifacts.require("LibraryTest");
const CallLibrary = artifacts.require("CallLibrary");

module.exports = function (deployer) {

  deployer.deploy(LibraryTest).then(
    () => {
      deployer.link(LibraryTest, CallLibrary)
      
      deployer.deploy(CallLibrary)
    }
  )
  
 

};



