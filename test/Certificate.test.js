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

    describe("Prefixed hash", ()=>{

        let from = {
            firstName: "Israel",
            lastName: "Komolehin",
            location: "University Of Ibadan, Nigeria",
            walletAddress: "0x292072a24aa02b6b0248C9191d46175E11C86270"
        } 

        let to = {
            firstName: "Tommy",
            lastName: "Shelby",
            location: "Ireland",
            walletAddress: "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"
        }

        let prefixedHash


        beforeEach(async()=>{
            prefixed = await cert.hashTransfer(from, to, 100)
        })

        it("generates the prefixed hash", async()=>{
            await prefixed.should.not.be.equal("", "it generates the prefixed hash")
            console.log(prefixed)
        })

    })


})