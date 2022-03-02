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
        let signature = "0xd86a15acf203b4602a59ba476f9edac51817085e2a26e843ddc85f0c5e04bc2d104d443efdb530614a9ba3af70cb02a2b8b4c9a4157c9a45e20fd774784c21441b"
        let signer  = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"
        let r = "0xd86a15acf203b4602a59ba476f9edac51817085e2a26e843ddc85f0c5e04bc2d"
        let s = "0x104d443efdb530614a9ba3af70cb02a2b8b4c9a4157c9a45e20fd774784c2144"
        let v = 27

        beforeEach(async()=>{
            prefixed = await cert.hashTransfer(from, to, 100)
        })

        it("generates the prefixed hash", async()=>{
            await prefixed.should.not.be.equal("", "it generates the prefixed hash")
            //console.log(prefixed)
        })

        it("verifies the signer", async()=>{
            const returnedSigner = await cert.verifySignature(r, s, v, prefixed)
            returnedSigner.should.be.equal(signer, "it verifies the signer and generates the right signer")
            
        })

    })


})