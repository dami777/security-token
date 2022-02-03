
const ERC1400 = artifacts.require("./ERC1400")

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract("ERC1400", ([address1, address2, operator])=>{

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

    describe("contract deployment", ()=>{

        it("has a contract address", ()=>{
            erc1400.address.should.not.be.equal("", "it has a contract address")
        })

    describe("partitions of a token holder", ()=>{

        it("returns an empty array of partitions", async()=>{
            console.log('okay')
        })

    })

    })

})