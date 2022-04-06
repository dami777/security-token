const Lib = artifacts.require("./LibraryTest")
const CallLib = artifacts.require("./CallLibrary")

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract("Library Test", ([account1])=>{

    let lib 
    let callLib

    beforeEach(async()=>{
        lib = await Lib.new()
        callLib = await CallLib.new()
    })

    /*describe("memory test", ()=>{
        it("returns the memory data", async()=>{
            const string = await lib.test("word")
            console.log(string)
        })
    })*/

    describe("call library", ()=>{

        let signature = "0x9292906193066a70b863da0861b6ea2e366074a455a4c5f6b1a79e7347734e4c72e3b654f028795e7eb8b7762a0be9b249484ac3586f809ba1bc072afe1713191b"
        let ethHash = "0xa420c3c01ff29855b5c7421b2a235747e80195ebea4a0eecde39229964686d97"
        let signer  = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"
        let fromIsWhiteListedOrIssuer = true
        let toIsWhiteListed = true
        //let data =  web3.eth.abi.encodeParameters(["bytes", "bytes32", "bool", "bool"], [signature, ethHash, fromIsWhiteListedOrIssuer, toIsWhiteListed])
        let data =  web3.eth.abi.encodeParameters(["bytes", "bytes32"], [signature, ethHash])

        let me = {
            name: "Israel"
        } 
        it("returns the memory data", async()=>{
            const string = await callLib.callString("word")
            console.log(string)
        })

        it("returns struct data", async()=>{
            const data = await lib.testStruct(signature)
            console.log(data)
        })

        it("returns signer", async()=>{
            const add = await lib.verifySignature(signature, ethHash)
            console.log(add)
        })

        it("returns signer", async()=>{
            const add = await callLib.verify(signature, ethHash)
            console.log(add)
        })

        it("decodes data", async()=>{
            const d = await lib.decodeData(data)
            console.log(d)
        })
    })

})