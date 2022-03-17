require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ethers } = require("ethers")
const { ETHER_ADDRESS, tokens, signer, data} = require("./helper.js")



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

        await erc1400.setController(signer)
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
        let createOrder

        const dataHex1 = web3.eth.abi.encodeParameter("string", secret1)
        let hash1 = ethers.utils.sha256(dataHex1)

        beforeEach(async()=>{

            erc1400.issueByPartition(classA, deployer, 100, data)
            await erc1400.authorizeOperator(htlc1400.address)       //set the htlc contract to be an operator
            createOrder = await htlc1400.openOrder(recipient1, 5, 10000, hash1, classA, web3.utils.toHex(""), {from: deployer})
        })

        it("emits an OpenOrder event", ()=>{
            createOrder.logs[0].event.should.be.equal("OpenedOrder", "it emits the Open Order event")
        })
       

    })

    

    

})