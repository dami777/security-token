const { encode } = require("punycode")

const DecodeContract = artifacts.require("./DecodeBytes")
require("chai")
    .use(require("chai-as-promised"))
    .should()

contract("Decode Bytes Contract", ()=>{

    let decodeContract 

    beforeEach(async()=>{
         decodeContract =  await DecodeContract.new()
    })

    describe("contract address", ()=>{
        
        it("has a contract address", ()=>{
            decodeContract.address.should.be.not.equal("", "it has a contract address")
        })

    })

    describe("decoding single data", ()=>{

        it("encoded the data", async()=>{
            const encode = await decodeContract.encode()
            encode.should.not.be.equal("", "returns an encoded data")
            console.log(encode)
        })

        it("decoded the data as expected", async()=>{
            const decode = await decodeContract.decode()
            decode.should.be.equal("test", "it decodes the data accurately")
            console.log(decode)
        })

    })

    describe("decoding struct", ()=>{ 

        let data = {
            month: 2,
            name: "Shelby"
        }

        it("encodes the struct data", async()=>{
            const encode = await decodeContract.encodeStruct(data)
            encode.should.not.be.equal("", "it returns an encoded data")
            console.log(encode)
        })

        it("decodes the data", async()=>{
            const decoded = await decodeContract.decodeStruct(data)
            decoded["0"].toString().should.be.equal(data.month.toString(), "it decodes the month from the data")
            decoded["1"].should.be.equal(data.name, "it decodes the name from the data")
            console.log(decoded["0"].toString(), decoded["1"])

        })
    })

    /*describe("it decodes signature from bytes", ()=>{

    })*/

    describe("signature encoding and decoding", ()=>{

        const signature = "0x9292906193066a70b863da0861b6ea2e366074a455a4c5f6b1a79e7347734e4c72e3b654f028795e7eb8b7762a0be9b249484ac3586f809ba1bc072afe1713191b"
        let encodedSignature

        it("encodes signaure", async()=>{
            encodedSignature = await decodeContract.encodeSignature(signature)
            
        })

        it("decodes the encoded signature", async()=>{
            const decode = await decodeContract.decodeBytes(encodedSignature)
            decode.should.be.equal(signature, "it decodes the signature")
        })

    })

})