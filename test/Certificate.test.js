const GenerateSig = artifacts.require("./GenerateEthSignature")
const CertLib = artifacts.require("./Certificate")
const { ethers } = require('ethers')
const ERC1400 = artifacts.require("./ERC1400")

const { stringToHex, setToken } = require("./helper")

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract("Certificate Data Test", ([tanglAdministrator, reitAdministrator])=>{

    let generateSig
    let certLib

    let tanglSecurityToken
    let reitSecurityToken

    let classA = stringToHex("CLASS A")
    let classB = stringToHex("CLASS B")

    
    
    
    let tanglTokenDetails = setToken("TANGL", "TAN", 18, 0, [classA.hex,classB.hex])
    let reitTokenDetails = setToken("Real Estate Investment Trust", "REIT", 18, 0, [classA.hex,classB.hex])



    beforeEach(async()=>{

        generateSig = await GenerateSig.new()       // instantiate the deployed instance of the GenerateEthSignature Contract
        certLib = await CertLib.new()               // instantiate the deployed instance of the Certificate Library

        tanglSecurityToken = await ERC1400.new(tanglTokenDetails.name, tanglTokenDetails.symbol, tanglTokenDetails.decimal, tanglTokenDetails.totalSupply, tanglTokenDetails.shareClass, {from: tanglAdministrator})
        reitSecurityToken = await ERC1400.new(reitTokenDetails.name, reitTokenDetails.symbol, reitTokenDetails.decimal, reitTokenDetails.totalSupply, reitTokenDetails.shareClass, {from: reitAdministrator})

    })

    describe("contract deployment", ()=>{

        it("has a contract address", async()=>{
            generateSig.address.should.not.be.equal("", "it has a contract address")
            
        })

    })

    describe("Prefixed hash", ()=>{

        let address = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"

        const salt = "0xa99ee9d3aab69713b85beaef7f222d0304b9c35e89072ae3c6e0cbabcccacc0a"

        let _from 
        let _to 
        let domainData
        let message 

        


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
            {name: "nonce", type: "uint256"}
        ]


        let types = {
            TransferData: transfer,
            Holder: holder
        }
        
        
    
        

        beforeEach(()=>{

             _from = {
                firstName: "Israel",
                lastName: "Komolehin",
                location: "University Of Ibadan, Nigeria",
                walletAddress: "0x292072a24aa02b6b0248C9191d46175E11C86270"
            } 
    
             _to = {
                firstName: "Tommy",
                lastName: "Shelby",
                location: "Ireland",
                walletAddress: "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"
            }
    
             domainData = {
                name: tanglTokenDetails.name,
                version: "1",
                chainId: 1337,
                verifyingContract: tanglSecurityToken.address,
                salt: salt //"0x0daa2a09fd91f1dcd75517ddae4699d3ade05dd587e55dc861fe82551d2c0b66"
    
            }

            message = {

                from:  _from,
                to: _to,
                amount: 100,
                nonce: 1
            }
        })

        

        
    


        let prefixed
        let signature
        let wallet
    

        it("returns the prefixed signed hash", async()=>{
            prefixed = await generateSig.generateEthSignature(domainData, _from, _to, 100)
            prefixed.should.not.be.equal("", "it returns a prefixed hash")
        })

        it("generate signature", async()=>{


            wallet = new ethers.Wallet("7e7155b289175223b18db53475a3d31e81a47af6c906ae1b2a79610de79b8665")        // get the address using private key
            signature = await wallet._signTypedData(domainData, types, message)         // generate signature using ethers js
            
            const encoded = web3.eth.abi.encodeParameters([
                "bytes", "bytes32", "uint256",
                {
                    "Holder" : {
                        "firstName" : "string",
                        "lastName" : "string",
                        "location" : "string",
                        "walletAddress" : "address",
                    }
                },

                {
                    "Holder" : {
                        "firstName" : "string",
                        "lastName" : "string",
                        "location" : "string",
                        "walletAddress" : "address",
                    }
                }
            ],

            [signature, salt, 1, _from, _to]
            )

            const decoded = await certLib.decodeData(encoded)

            console.log(decoded)
            
            const returnedSigner = await certLib.returnSigner(encoded, 100, tanglSecurityToken.address, tanglTokenDetails.name)
            
            console.log(returnedSigner)
            
        })

        /*it("verifies the signer of the data", async()=>{
    
            const sigFromMetaMask = "0x112ec2161fb45d6c51ee3235b889a3d416e6c14236321bd1f133e0ec31454de176a313a7de9e939bd9f4370b3445e870dbbe46aa38859ed2a0111db79da97e061c"
            
            const returnedEthersSigner = await certLib.verifySignature(signature, prefixed)
            const returnedMetaSigner = await certLib.verifySignature(sigFromMetaMask, prefixed)

            returnedEthersSigner.should.be.equal(wallet.address, "it verifies the signer")
            returnedMetaSigner.should.be.equal(address, "it verifies the signer")
        })*/

    })


})