const GenerateSig = artifacts.require("./GenerateEthSignature")

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract("Certificate Data Test", ()=>{

    let cert

    beforeEach(async()=>{
        generateSig = await GenerateSig.new()
    })

    describe("contract deployment", ()=>{

        it("has a contract address", async()=>{
            generateSig.address.should.not.be.equal("", "it has a contract address")
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

        let domainData = {

            verifyingContract: generateSig.address,
            version: "1",
            companyName: "Tangle Capital Partners",
            chainID: 1337,
            salt: generateSig.address

        }


        let prefixed
        let signature = "0x9292906193066a70b863da0861b6ea2e366074a455a4c5f6b1a79e7347734e4c72e3b654f028795e7eb8b7762a0be9b249484ac3586f809ba1bc072afe1713191b"
        let signer  = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"

        /*const _signature = signature.substring(2)
        const r = "0x" + _signature.substring(0, 64)
        const s = "0x" + _signature.substring(64, 128)
        const v = parseInt(_signature.substring(128, 130), 16)*/


        it("returns the prefixed signed hash", async()=>{
            prefixed = await generateSig.generateEthSignature(domainData, from, to, 10)
            console.log(prefixed)
        })

    })


})