
const Cert = artifacts.require("./Certificate")

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract("Cert", ([account1, account2])=>{

    let cert 

    beforeEach(async()=>{
        cert = await Cert.new()
    })

    describe("deployment", ()=>{

        it("has a contract address", async()=>{

            cert.address.should.not.be.equal("", "it has contract address")

        })

    })

})
