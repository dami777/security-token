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

    describe("Identity hashing", ()=>{

        let identity = {

            _from: address1,
            _to: address2,
            _amount: 10

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

    })


    describe("signing code", ()=>{

        let domain = [
            {name: "name", type: "string"},
            {name: "version", type: "string"},
            {name: "chainId", type: "uint256"},
            {name: "verifyingContract", type: "address"},
            {name: "salt", type: "bytes32"}
        ]


        let identity = [
            {name: "_from", type: "address"},
            {name: "_to", type: "address"},
            {name: "_amount", type: "uint256"}
        ]


        let domainData = {
            name: "Dapp Name",
            version: "1",
            chainId: 5777,
            verifyingContract: certificate.this
        }

    })


})