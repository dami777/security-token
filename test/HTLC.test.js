require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ethers } = require("ethers")
const { ETHER_ADDRESS, tokens, signer, data, signature, ethHash} = require("./helper.js")



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


   /* describe("Contract deployment", ()=>{

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

    })*/

    describe("open order", ()=>{

        let secret1 = web3.utils.asciiToHex("anonymous")
        let orderID = web3.utils.asciiToHex("x23dvsdgd")
        let createOrder

        let dataHex1 = web3.eth.abi.encodeParameter("bytes32", secret1)
        let hash1 = ethers.utils.sha256(dataHex1)

        beforeEach(async()=>{

            erc1400.issueByPartition(classA, deployer, 100, data)
            await erc1400.authorizeOperator(htlc1400.address)       //set the htlc contract to be an operator
            createOrder = await htlc1400.openOrder(orderID, secret1, hash1, classA, deployer, tokens(5), 10000, data, {from: deployer})
            
        })


        describe("successful open orders", ()=>{
            
            it("made the htlc contract an operator", async ()=>{

                const isOperator = await erc1400.isOperator(htlc1400.address, deployer)
                isOperator.should.be.equal(true, "the htlc for the security token is an operator")
                
            })

            it("opens order", async()=>{
                
                createOrder.logs[0].event.should.be.equal("OpenedOrder", "it emits the Open Order event")

            })

            it("updates the balance of the balance of the htlc contract", async()=>{
                const htlcBalance = await erc1400.balanceOfByPartition(classA, htlc1400.address)
                htlcBalance.toString().should.be.equal(tokens(5).toString(), "the token was deposited to the htlc contract")
            })

            it("updates the balance of the issuer", async()=>{
                const issuerBalance = await erc1400.balanceOfByPartition(classA, deployer)
                issuerBalance.toString().should.be.equal(tokens(95).toString(), "the token was transferred from the issuer's waller")
            })
        })

        describe("failed open order", ()=>{

            it("fails to open order with an existing order ID", async()=>{
                await htlc1400.openOrder(orderID, secret1, hash1, classA, deployer, tokens(5), 10000, data, {from: deployer}).should.be.rejected
            })

        })

    })

    describe("swap", ()=>{
        
    })


})