
const Cert = artifacts.require("./Certificate")

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

            const signature = "0xf05510998daddf485a4d8a3a6bbd56840200ae9c44801f35ecefc4cd8013b9b827d6f9e1f57913f08f1e83be2c71c71b8b55bd6151ed7a4226e981f9dbdab1261b"



            beforeEach(async()=>{

                await cert.generateEthSignHash(signature)
                signatureHash = await cert.hashedSignature()

            })

            it("verifies the signer", async()=>{

                await cert.verifySignature(signatureHash, signature)
                const address = await cert.returnedSigner()
                console.log(address)
                console.log(account1)
            })

        })

    })

})
