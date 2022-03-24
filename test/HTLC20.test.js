require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ethers, Contract } = require("ethers")
const moment = require("moment");
const { ETHER_ADDRESS, tokens, swapState} = require("./helper.js")

//  connect to the smart contract

const HTLC20 = artifacts.require("./HTLC20")
const ERC20_USDT = artifacts.require("./ERC20")     // this erc20 token will be represented as usdt


contract("HTLC20", ([issuer, investor1, investor2])=>{

    let htlc20 
    let erc20


    beforeEach(async()=>{

        
        erc20 = await ERC20_USDT.new("US Dollars Tether", "USDT")
        htlc20 = await HTLC20.new(erc20.address)
        

    })    


    describe("Contract deployment", ()=>{

        it("has a contract address", ()=>{

            htlc20.address.should.be.not.equal("", "the htlc contract for the erc20 token has an address")
            erc20.address.should.not.be.equal("", "the erc20_usdt has a contract address")
            

        })

    })

    describe("open order", ()=>{

        let openOrder
        let secret1 = web3.utils.asciiToHex("anonymous")
        let dataHex1 = web3.eth.abi.encodeParameter("bytes32", secret1)
        let secretHash = ethers.utils.sha256(dataHex1)
        let orderID = web3.utils.asciiToHex("x23dvsdgd")
        let expiration = new Date(moment().add(1, 'days').unix()).getTime()    // expiration will be present time + 1 day


        beforeEach(async()=>{

            openOrder = await htlc20.openOrder(orderID, investor1, tokens(1000), expiration, secretHash, secret1)

        })

        describe("successful open order", ()=>{

            let checkOrder

            beforeEach(async()=>{
                checkOrder = await htlc20.checkOrder(orderID)
            })

            it("emits the open order event", ()=>{
                openOrder.logs[0].event.should.be.equal("OpenedOrder", "it emits the open order event")
            })

            it("changes the swap state from INVALID to OPEN", ()=>{
                checkOrder._orderState.toString().should.be.equal(swapState.OPEN, "it is an open order")
            })

            it("registers the correct order information", ()=>{
                checkOrder._amount.toString().should.be.equal(tokens(1000).toString(), "it registers the correct price")
                checkOrder._investor.should.be.equal(investor1, "it registers the investor needed to fund this order")
                checkOrder._recipient.should.be.equal(issuer, "the issuer is the recipient of the order")
            })

        })

        describe("failed open order", ()=>{

            it("fails to open order for an existing order ID", async()=>{
                await htlc20.openOrder(orderID, investor1, tokens(1000), expiration, secretHash, secret1).should.be.rejected
            })

            it("fails to open order if the issuer tries to open an order with a secret that is incompatible with the provided hash", async()=>{
                
                const orderID2 = web3.utils.asciiToHex("x23dlsdgd")
                await htlc20.openOrder(orderID2, investor1, tokens(1000), expiration, secretHash, web3.utils.asciiToHex("avalanche")).should.be.rejected
            })

        })

        describe("funding order", ()=>{

            let funded

        
            beforeEach(async()=>{
                await erc20.transfer(investor1, tokens(2000))   // investor purchases usdt token from escrow/exchanges/p2p/any secondary market
                funded = await htlc20.fundOrder(orderID, {from: investor1})
            })

            it("emits the funded event", ()=>{
                funded.logs[0].event.should.be.equal("Funded", "it emits the Funded event after an investor funds an order with his payment")
            })
        })

        

    })

})