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
            const signature = "0x17cbf6b4b20b9d589964240082e191e19af162c5afa798d7708af4a379366c865f50ece85b288fd2c57292b9f7867af98d112bb9dd4964593b3f0c81dd839dc51b"
           
            console.log("signature length ---->", signature.length)

            await certificate.verifySignature(signature)
            const returnedSigner = await certificate.returnedSigner()
            console.log("returned signer ", returnedSigner)
        })

    })


    


})