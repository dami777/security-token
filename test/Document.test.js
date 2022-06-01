const ERC1400 = artifacts.require('./ERC1400')


require("chai")
    .use(require("chai-as-promised"))
    .should()

const { stringToHex, setToken, certificate, tokens, ETHER_ADDRESS, reverts, tanglAdministratorPrivkey } = require("./helper")



contract("ERC1400", ([tanglAdministrator, address1])=>{

    let tanglSecurityToken

    let classA = stringToHex("CLASS A")
    let classB = stringToHex("CLASS B")
    let classless = stringToHex("classless").hex

    let tanglTokenDetails = setToken("TANGL", "TAN", 18, 0, [classA.hex,classB.hex])
   
    beforeEach( async()=>{

        tanglSecurityToken = await ERC1400.new(tanglTokenDetails.name, tanglTokenDetails.symbol, tanglTokenDetails.decimal, {from: tanglAdministrator})

    })

    describe("contract address", ()=>{

        it("has a contract address", async()=>{
            tanglSecurityToken.address.should.be.not.be.equal("", "it has a contract address")
        })

    })

    describe("document upload",()=>{

                             
        let documentName = "Bond Contract"
        let documentHash = "qr4353tfgbdfry54y45"                    //  the hash will be gotten from the IPFS

        let documentNameHex = stringToHex(documentName).hex         // convert string to hex. This is the datatype that web3 understands for bytes32 datatype
        let documentHashHex = stringToHex(documentHash).hex

        let documentUri = "pinata.com"

        let setDocument


        beforeEach(async()=>{

            setDocument = await tanglSecurityToken.setDocument(documentNameHex, documentUri, documentHashHex)
        
        })


        it("emits event when document is set onchain", async()=>{

            setDocument.logs[0].event.should.be.equal("Document", "it emits the document upload event")
            setDocument.logs[0].args._uri.should.be.equal(documentUri, "it emits the URI of the document")
            web3.utils.hexToUtf8(setDocument.logs[0].args._name).should.be.equal(documentName, "it emits the name of the document")
            web3.utils.hexToUtf8(setDocument.logs[0].args._documentHash).should.be.equal(documentHash, "it emits the hash of the document")
            
        })

        it("fetches the document from the chain", async()=>{

            const document = await tanglSecurityToken.getDocument(documentNameHex)
            document["0"].should.be.equal(documentUri, "it returns the correct document uri")
            web3.utils.hexToUtf8(document["1"]).should.be.equal(documentHash, "it returns the hash of the document")

        })

        

    })

})