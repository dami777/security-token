const { decode } = require("punycode")

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
            const decoded = await decodeStruct(data)
            decoded["0"].toString().should.be.equal(data.month.toString(), "it decodes the month from the data")
        })
    })

})