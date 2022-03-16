require("chai")
    .use(require("chai-as-promised"))
    .should()

const HTLC20 = artifacts.require("./HTLC")
const HTLC1400 = artifacts.require("./HTLC1400")

contract("HTLC", ()=>{

    let htlc20 
    let htlc1400

    beforeEach(async()=>{
        htlc20 = await HTLC20.new()
        htlc1400 = await HTLC1400.new()
    })


    describe("Contract deployment", ()=>{

        it("has a contract address", ()=>{
            htlc.address.should.be.not.equal("", "the contract has an address")
        })

    })

})