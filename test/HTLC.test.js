require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ETHER_ADDRESS, tokens } = require("./helper.js")
const jsSHA = require("jssha");

const HTLC20 = artifacts.require("./HTLC20")
const HTLC1400 = artifacts.require("./HTLC1400")
const ERC1400 = artifacts.require("./ERC1400")

contract("HTLC", ([deployer, recipient1, recipient2, recipient3])=>{

    let htlc20 
    let htlc1400
    let erc1400

    let name = "Tangl"
    let symbol = "TAN"
    let decimal = 18
    let totalSupply = 0
    let classA = web3.utils.asciiToHex("CLASS A")
    let classB = web3.utils.asciiToHex("CLASS B")

    beforeEach(async()=>{

        erc1400 = await ERC1400.new(name, symbol, decimal, totalSupply, [classA, classB] )
        htlc20 = await HTLC20.new()
        htlc1400 = await HTLC1400.new(erc1400.address)
    })


    describe("Contract deployment", ()=>{

        it("has a contract address", ()=>{

            htlc20.address.should.be.not.equal("", "the htlc contract for the erc20 token has an address")
            htlc1400.address.should.be.not.equal("", "the htlc contract for the security token has an address")
        })

    })

    describe("htlc connection to the security token",  ()=>{

        it("detects the security token contract", async()=>{
            const token = await htlc1400.ERC1400_TOKEN()
            token.should.be.equal(erc1400.address, "the interface detects the token address")
        })

    })

    describe("open order", ()=>{

        let secret1 = "anonymous"
        let secret2 = "avalanche"

        it("creates a swap order", async()=>{
            console.log(ETHER_ADDRESS)
        })

    })

    describe("sha245 hash", ()=>{
        
        const data = web3.eth.abi.encodeParameter("string", "anonymous")

        it("prints data", async()=>{
            const data1 = await htlc1400.hashTest()
            const data2 = jsSHA.

            console.log(data1, "hash from solidity")
            console.log(data2, "hash from web3 js")

        })

    })

    

})