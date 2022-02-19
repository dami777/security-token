const ERC1400 = artifacts.require('./ERC1400')
const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

const tokens=(n)=>{
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
    
}

require("chai")
    .use(require("chai-as-promised"))
    .should()


contract("ERC1400", ([address1])=>{

    let erc1400
    let name = "Tangl"
    let symbol = "TAN"
    let decimal = 18
    let totalSupply = 0
    let classA = web3.utils.asciiToHex("CLASS A")
    let classB = web3.utils.asciiToHex("CLASS B")

    beforeEach( async()=>{
        erc1400 = await ERC1400.new(name, symbol, decimal, totalSupply, [classA, classB])
    })

    describe("contract address", ()=>{

        it("has a contract address", async()=>{
            erc1400.address.should.be.not.be.equal("", "it has a contract address")
        })

    })

    describe("document upload",()=>{

        let documentName = web3.utils.asciiToHex("contract")    // convert string to hex. This is the datatype that web3 understands for bytes32 datatype
        let documentUri = "pinata.com"
        let documentHash = web3.utils.asciiToHex("qr4353tfgbdfry54y45")

        let setDocument


        beforeEach(async()=>{
            setDocument = await erc1400.setDocument(documentName, documentUri, documentHash)
        })


        it("emits an event when document is set onchain", async()=>{

            setDocument.logs[0].event.should.be.equal("Document", "it emits the document upload event")
            
        })

        

    })

})