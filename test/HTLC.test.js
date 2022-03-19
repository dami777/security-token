require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ethers } = require("ethers")
const { ETHER_ADDRESS, tokens, signer, data, signature, ethHash} = require("./helper.js")



const HTLC20 = artifacts.require("./HTLC20")
const HTLC1400 = artifacts.require("./HTLC1400")
const ERC1400 = artifacts.require("./ERC1400")

contract("HTLC", ([issuer, investor1, investor2, investor3])=>{

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
        let secret2 = web3.utils.asciiToHex("avalanche")
        let orderID = web3.utils.asciiToHex("x23dvsdgd")
        let createOrder

        let dataHex1 = web3.eth.abi.encodeParameter("bytes32", secret1)
        let hash1 = ethers.utils.sha256(dataHex1)

        beforeEach(async()=>{

            erc1400.issueByPartition(classA, issuer, 100, data)
            await erc1400.authorizeOperator(htlc1400.address)       //set the htlc contract to be an operator
            createOrder = await htlc1400.openOrder(orderID, secret1, hash1, classA, investor1, tokens(5), 10000, data, {from: issuer})
            
        })


        describe("successful open orders", ()=>{
            
            it("made the htlc contract an operator", async ()=>{

                const isOperator = await erc1400.isOperator(htlc1400.address, issuer)
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
                const issuerBalance = await erc1400.balanceOfByPartition(classA, issuer)
                issuerBalance.toString().should.be.equal(tokens(95).toString(), "the token was transferred from the issuer's waller")
            })

            it("emits the correct open order event data", ()=>{
                createOrder.logs[0].args._recipient.should.be.equal(investor1, "it emits the correct recipient address of the security token")
                createOrder.logs[0].args._tokenValue.toString().should.be.equal(tokens(5).toString(), "it emits the value deposited")
                createOrder.logs[0].args.partition.should.be.equal(classA, "it emits the partition of the deposited token")
                createOrder.logs[0].args._secretHash.should.be.equal(hash1, "it emits the hash of the open order")
            })
        })

        describe("failed open order", ()=>{

            it("fails to open order with an existing order ID", async()=>{
                await htlc1400.openOrder(orderID, secret1, hash1, classA, investor1, tokens(5), 10000, data, {from: issuer}).should.be.rejected
            })

            it("fails to open an order if the secret provided by the issuer doesn't match the hash", async()=>{

                const orderID2 = web3.utils.asciiToHex("x23dvsdgd5t")
                await htlc1400.openOrder(orderID2, secret2, hash1, classA, investor2, tokens(5), 10000, data, {from: issuer}).should.be.rejected
            })

        })

    })

    describe("swap", ()=>{
        
    })


})