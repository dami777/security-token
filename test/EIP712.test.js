const Certificate = artifacts.require("./EIP712")

require("chai")
    .use(require("chai-as-promised"))
    .should()


contract("EIP712 Standard", ([address1, address2, address3])=>{

    let certificate

    beforeEach(async()=>{

        certificate = await Certificate.new()

    })

    describe("contract deployment", ()=>{

        it("has a contract address", ()=>{
            certificate.address.should.not.be.equal("", "contract has an address")
        })

    })


})