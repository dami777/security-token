const DecodeContract = artifacts.require("./DecodeBytes")
require("chai")
    .use(require("chai-as-promised"))
    .should()

contract("Decode Bytes Contract", ()=>{

    let decodeContract 

    beforeEach(async()=>{
         decodeContract =  await DecodeContract.new()
    })

    describe("contract address", ()=>{
        
        it("has a contract address", ()=>{
            decodeContract.address.should.be.not.equal("", "it has a contract address")
        })

    })

})