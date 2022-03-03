require("./helper.js")
require("chai")
    .use(require("chai-as-promised"))
    .should()

const ERC1400 = artifacts.require("./ERC1400")


contract("Transfer With Data", ([deployer, holder1, holder2])=>{

    let token
    let name = "Tangl"
    let symbol = "TAN"
    let decimal = 18
    let totalSupply = 0
    let classA = web3.utils.asciiToHex("CLASS A")
    let classB = web3.utils.asciiToHex("CLASS B")



    beforeEach( async()=>{
        token = await ERC1400.new(name, symbol, decimal, totalSupply, [classA, classB])
    })

    describe("deployment", ()=>{

        it("has a contract address", async()=>{
            
            token.address.should.not.be.equal("", "it has a contract address")
        })

    })


})