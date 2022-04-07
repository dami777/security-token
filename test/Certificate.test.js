const GenerateSig = artifacts.require("./GenerateEthSignature")
const CertLib = artifacts.require("./Certificate")
const { ethers } = require('ethers')
const { TypedDataUtils } = require('ethers-eip712')

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract("Certificate Data Test", ([issuer])=>{

    let generateSig
    let certLib

    beforeEach(async()=>{

        generateSig = await GenerateSig.new()       // instantiate the deployed instance of the GenerateEthSignature Contract
        certLib = await CertLib.new()               // instantiate the deployed instance of the Certificate Library

    })

    describe("contract deployment", ()=>{

        it("has a contract address", async()=>{
            generateSig.address.should.not.be.equal("", "it has a contract address")
            
        })

    })

    describe("Prefixed hash", ()=>{

        const address = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"

        let _from = {
            firstName: "Israel",
            lastName: "Komolehin",
            location: "University Of Ibadan, Nigeria",
            walletAddress: "0x292072a24aa02b6b0248C9191d46175E11C86270"
        } 

        let _to = {
            firstName: "Tommy",
            lastName: "Shelby",
            location: "Ireland",
            walletAddress: "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"
        }

        let domainData = {
            name: "Tangle Capital Partners",
            version: "1",
            chainId: 1337,
            verifyingContract: address,
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

            from:  _from,
            
            to: _to,
    
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
        let signature
        let wallet
    

        it("returns the prefixed signed hash", async()=>{
            prefixed = await generateSig.generateEthSignature(domainData, _from, _to, 10)
            prefixed.should.not.be.equal("", "it returns a prefixed hash")
        })

        it("generate signature", async()=>{

            const digest = TypedDataUtils.encodeDigest(typedData)
            //const digestHex = ethers.utils.hexlify(digest)
            
            wallet = new ethers.Wallet("177cd11440560b48c69ee286cea70bc6a5baa6ece8ef317efb739dafc25b6d53")        // get the address using private key
            signature = await wallet.signMessage(digest)
            signature.should.not.be.equal("", "it returns the signature")
           
        })

        it("verifies the signer of the data", async()=>{
            const returnedSigner = await certLib.verifySignature(signature, prefixed)
            console.log(returnedSigner)
        })

    })


})