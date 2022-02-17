const { verify } = require("crypto")

const Certificate = artifacts.require("./EIP712")

require("chai")
    .use(require("chai-as-promised"))
    .should()


contract("EIP712 Standard", ([address1, address2, address3])=>{

    let certificate

    beforeEach(async()=>{

        certificate = await Certificate.new()

    })

    describe("contract deployment", ()=>{

        it("has a contract address", ()=>{
            certificate.address.should.not.be.equal("", "contract has an address")
        })

    })

    describe("Identity hashing and signing", ()=>{

        let identity = {

            _from: "Mr Thomas Shelby",
            _amount: 100

        }

        let identityHash
        let ethHash

        beforeEach(async()=>{
            identityHash = await certificate.hashIdentity(identity)
            await certificate.ethHash(identity)
        })

        it("hashed the identity object", ()=>{
            identityHash.should.not.be.equal("", "the identity object has been hashed")
            console.log(identityHash, "identity object")
        })

        it("generates an hashed value of the hased Identity", async()=>{
            ethHash = await certificate._ethHash()
            ethHash.should.not.be.equal("", "generated ethereum hash is not empty")
            console.log(ethHash)
        })

        it("verifies the signer", async()=>{
            const signature = "0x06453f929f6a5e3dd10fafb072fceb3993badf86d148540db56c6114aceae35b4d0462bd7ff24191bc840a6cae1f235de49e59053b123024af5587db7fa8e11a1b"
           
            console.log("signature length ---->", signature.length)

            await certificate.verifySignature(signature)
            const returnedSigner = await certificate.returnedSigner()
            console.log("returned signer ", returnedSigner)
        })

    })


    


})