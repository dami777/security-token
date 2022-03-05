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

        let prefixed
        let signature = "0x9292906193066a70b863da0861b6ea2e366074a455a4c5f6b1a79e7347734e4c72e3b654f028795e7eb8b7762a0be9b249484ac3586f809ba1bc072afe1713191b"
        let signer  = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"

        /*const _signature = signature.substring(2)
        const r = "0x" + _signature.substring(0, 64)
        const s = "0x" + _signature.substring(64, 128)
        const v = parseInt(_signature.substring(128, 130), 16)*/


        beforeEach(async()=>{
            prefixed = await cert.hashTransfer(from, to, 100)
        })

        it("generates the prefixed hash", async()=>{
            await prefixed.should.not.be.equal("", "it generates the prefixed hash")
            console.log(prefixed)
        })

        it("verifies the signer", async()=>{
            const returnedSigner = await cert.verifySignature(signature, prefixed)
            returnedSigner.should.be.equal(signer, "it verifies the signer and generates the right signer")
            
        })

    })


})