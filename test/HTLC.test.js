require("chai")
    .use(require("chai-as-promised"))
    .should()

const HTLC = artifacts.require("./HTLC")

contract("HTLC", ()=>{

    let htlc 

    beforeEach(async()=>{
        htlc = await HTLC.new()
    })


    describe("Contract deployment", ()=>{

        it("has a contract address", ()=>{
            htlc.address.should.be.not.equal("", "the contract has an address")
        })

    })

})