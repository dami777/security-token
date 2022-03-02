
const Cert = artifacts.require("./SignedMessage")

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract("Cert", ([account1, account2])=>{

    let cert 

    beforeEach(async()=>{
        cert = await Cert.new()
    })

    describe("deployment", ()=>{

        it("has a contract address", async()=>{

            cert.address.should.not.be.equal("", "it has contract address")

        })


    })

    describe("message hashing", ()=>{

        let message = "Transaction Approved"
        let messageHash
        let signatureHash
        
        beforeEach(async()=>{

            await cert.generateMessageHash(message)

        })

        it("hashes the message", async()=>{

            messageHash= await cert.messageToSign()
            messageHash.should.not.be.equal("", "returns a message hash")
            console.log("message hash ", messageHash)

        })

        describe("signature verification", ()=>{

            const signature = "0x9d92e98dc1595a1056b08370167700effa4cac27707573ea806448d97709c1500236d1415a6908858cf3249cc8c015a01ec07243451212b306909ae5e20938d41b"



            beforeEach(async()=>{

                await cert.generateEthSignHash(messageHash)
                signatureHash = await cert.hashedSignature()

            })

            it("verifies the signer", async()=>{

                const signerAddress = "0x3b38b124019267a4A12505CBc9D81eD14461165A"

                await cert.verifySignature(signatureHash, signature)
                const returnedAddress = await cert.returnedSigner()
                returnedAddress.should.be.equal(signerAddress, "returned the correct signer of the message")
                console.log(returnedAddress, " is the signer's address")
               
            })

        })

    })

})
