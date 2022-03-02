const Certificate = artifacts.require("./Certificate")

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract("Certificate Data Test", ()=>{

    let cert

    beforeEach(async()=>{
        cert = await Certificate.new()
    })

    describe("contract deployment", ()=>{

        it("has a contract address", async()=>{
            cert.address.should.not.be.equal("", "it has a contract address")
        })

    })


})