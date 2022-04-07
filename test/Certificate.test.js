const GenerateSig = artifacts.require("./GenerateEthSignature")
const { ethers } = require('ethers')
const { TypedDataUtils } = require('ethers-eip712')

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract("Certificate Data Test", ()=>{

    let generateSig

    beforeEach(async()=>{

        generateSig = await GenerateSig.new()

    })

    describe("contract deployment", ()=>{

        it("has a contract address", async()=>{
            generateSig.address.should.not.be.equal("", "it has a contract address")
            //console.log(generateSig.address)
        })

    })

    describe("Prefixed hash", ()=>{

        const address = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"

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

            verifyingContract: address,
            version: "1",
            name: "Tangle Capital Partners",
            chainID: 1337,
            salt: "0x0daa2a09fd91f1dcd75517ddae4699d3ade05dd587e55dc861fe82551d2c0b66"

        }

        let domain = [
            {name: "name", type: "string"},
            {name: "version", type: "string"},
            {name: "chainId", type: "uint256"},
            {name: "verifyingContract", type: "address"},
            {name: "salt", type: "bytes32"}
        ]
        
    
    
        let holder = [
    
            {name: "firstName", type: "string"},
            {name: "lastName", type: "string"},
            {name: "location", type: "string"},
            {name: "walletAddress", type: "address"}
        ]
    
        let transfer = [
    
            {name: "from", type: "Holder"},
            {name: "to", type: "Holder"},
            {name: "amount", type: "uint256"},
    
        ]
        
        
    
        let message = {

            from:  {
                firstName: "Israel",
                lastName: "Komolehin",
                location: "University Of Ibadan, Nigeria",
                walletAddress: "0x292072a24aa02b6b0248C9191d46175E11C86270"
            },
            
            to: {
                firstName: "Tommy",
                lastName: "Shelby",
                location: "Ireland",
                walletAddress: "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"
            },
    
            amount: 100
        }
    
    
        let typedData = {
            types : {
                EIP712Domain: domain,
                Transfer: transfer,
                Holder: holder
            },

            primaryType: "Transfer",
            domain: domainData,   
            message: message
        
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
            prefixed.should.not.be.equal("", "it returns a prefixed hash")
        })

        it("generate signature", async()=>{
            const digest = TypedDataUtils.encodeDigest(typedData)
            //const digestHex = ethers.utils.hexlify(digest)
            
            //const wallet = ethers.Wallet.createRandom()
            //const signature = wallet.signMessage(digest)

            console.log(digest)
        })

    })


})