require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ethers } = require("ethers")
const { ETHER_ADDRESS, tokens, signer, data, signature, ethHash, wait, swapState, BYTES_0} = require("./helper.js")
const moment = require("moment");





const HTLC1400 = artifacts.require("./HTLC1400")
const ERC1400 = artifacts.require("./ERC1400")




contract("HTLC1400", ([issuer, investor1, investor2, investor3])=>{

    
    let htlc1400
    let tangleSeurityToken
    

    let name = "Tangl"
    let symbol = "TAN"
    let decimal = 18
    let totalSupply = 0
    let classA = web3.utils.asciiToHex("CLASS A")
    let classB = web3.utils.asciiToHex("CLASS B")

    beforeEach(async()=>{

        tangleSeurityToken = await ERC1400.new(name, symbol, decimal, totalSupply, [classA, classB])
        reit = await ERC1400.new("Real Estate Investment Trust", "REIT", decimal, totalSupply, [classA, classB])

        htlc1400 = await HTLC1400.new()

        await tangleSeurityToken.setController(signer)
        await reit.setController(signer)
    })


    describe("Contract deployment", ()=>{

        it("has a contract address", ()=>{

           
            htlc1400.address.should.be.not.equal("", "the htlc contract for the security token has an address")
            tangleSeurityToken.address.should.not.be.equal("", "the security token contract has an address")

        })

    })

    describe("htlc1400", ()=>{

        let secret1 = web3.utils.asciiToHex("anonymous")
        let secret2 = web3.utils.asciiToHex("avalanche")
        let orderID = web3.utils.asciiToHex("x23dvsdgd")
        let createOrder

        let dataHex1 = web3.eth.abi.encodeParameter("bytes32", secret1)
        let hash1 = ethers.utils.sha256(dataHex1)
        let expiration = new Date(moment().add(1, 'days').unix()).getTime()    // expiration will be present time + 1 day

        beforeEach(async()=>{

            await tangleSeurityToken.issueByPartition(classA, issuer, 100, data)
            await tangleSeurityToken.authorizeOperator(htlc1400.address)       //set the htlc contract to be an operator
            createOrder = await htlc1400.openOrder(orderID, secret1, hash1, classA, investor1, tangleSeurityToken.address, tokens(5), expiration, data, {from: issuer})
            
        })


        describe("successful open orders", ()=>{
            
            it("should register the htlc contract address as an operator", async ()=>{

                const isOperator = await tangleSeurityToken.isOperator(htlc1400.address, issuer)
                isOperator.should.be.equal(true, "the htlc for the security token is an operator")
                
            })

            it("opens order", async()=>{
                
                createOrder.logs[0].event.should.be.equal("OpenedOrder", "it emits the Open Order event")

            })

            it("updates the balance of the htlc contract", async()=>{
                const htlcBalance = await tangleSeurityToken.balanceOfByPartition(classA, htlc1400.address)
                htlcBalance.toString().should.be.equal(tokens(5).toString(), "the token was deposited to the htlc contract")
            })

            it("updates the balance of the issuer", async()=>{
                const issuerBalance = await tangleSeurityToken.balanceOfByPartition(classA, issuer)
                issuerBalance.toString().should.be.equal(tokens(95).toString(), "the token was transferred from the issuer's wallet")
            })

            it("emits the correct open order event data", ()=>{
                createOrder.logs[0].args._investor.should.be.equal(investor1, "it emits the correct recipient address of the security token")
                createOrder.logs[0].args._amount.toString().should.be.equal(tokens(5).toString(), "it emits the value deposited")
                createOrder.logs[0].args._secretHash.should.be.equal(hash1, "it emits the hash of the open order")
                createOrder.logs[0].args._expiration.toString().should.be.equal(expiration.toString(), "it emits the day and time the withdrawal expires")
                createOrder.logs[0].args._securityToken.should.be.equal(tangleSeurityToken.address, "it emits the security token address used to create the order")
                
            })
        })

        describe("failed open order", ()=>{

            it("fails to open order with an existing order ID", async()=>{
                await htlc1400.openOrder(orderID, secret1, hash1, classA, investor1, tangleSeurityToken.address, tokens(5), 10000, data, {from: issuer}).should.be.rejected
            })

            it("fails to open an order if the secret provided by the issuer doesn't match the hash", async()=>{

                const orderID2 = web3.utils.asciiToHex("x23dvsdgd5t")
                await htlc1400.openOrder(orderID2, secret2, hash1, classA, investor2, tangleSeurityToken.address, tokens(5), 10000, data, {from: issuer}).should.be.rejected
            })

        })

        describe("successful withdrawal", ()=>{

            let successfulWithDrawal

            beforeEach(async()=>{
                successfulWithDrawal = await htlc1400.recipientWithdrawal(orderID, secret1, tangleSeurityToken.address, {from: investor1})
            })

            it("emits the Closed Order event", ()=>{
                successfulWithDrawal.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event")
            })

            it("updates the balance of the investor and the htlc contract", async()=>{
                const investorBalance = await tangleSeurityToken.balanceOfByPartition(classA, investor1)
                const htlcBalance = await tangleSeurityToken.balanceOfByPartition(classA, htlc1400.address)

                investorBalance.toString().should.be.equal(tokens(5).toString(), "the token was transferred to the investor's wallet after providing the valid secret")
                htlcBalance.toString().should.be.equal(tokens(0).toString(), "the token was removed from the htlc contract address to the investor's wallet")

            })

            it("fetches the order details", async()=>{

                const order = await htlc1400.checkOrder(orderID, tangleSeurityToken.address)
                order._investor.should.be.equal(investor1, "it fetched the recipient of the order")
                order._issuer.should.be.equal(issuer, "it fetched the issuer of the order")
                order._amount.toString().should.be.equal(tokens(5).toString(),"it fetched the amount in the order")
                order._expiration.toString().should.be.equal(expiration.toString(),"it fetched the expiration of the order")
                order._orderState.toString().should.be.equal(swapState.CLOSED, "it fetched the updated order state which is closed")
                
            })

        })

        describe("failed withdrawal", ()=>{

            let orderID2 = web3.utils.asciiToHex("x23d33sdgdp")
            const expiration2 = new Date(moment().subtract(2, 'days').unix()).getTime()       // set expiration to 2 days before
            
            
            beforeEach(async()=>{
                createOrder2 = await htlc1400.openOrder(orderID2, secret1, hash1, classA, investor2, tangleSeurityToken.address, tokens(5), expiration2, data, {from: issuer})
            })


            it("fails to withdraw because the withdrawal date has expired", async()=>{
                await htlc1400.recipientWithdrawal(orderID2, secret1, tangleSeurityToken.address, {from: investor2}).should.be.rejected
            })

            it("fails due to withdrawal by an invalid recipient of a particular order", async()=>{
                await htlc1400.recipientWithdrawal(orderID, secret1, tangleSeurityToken.address, {from: investor2}).should.be.rejected
            })

            it("fails due to withdrawal of an id that isn't opened", async()=>{
                await htlc1400.recipientWithdrawal(web3.utils.asciiToHex("35trgd"), secret1, tangleSeurityToken.address, {from: investor1}).should.be.rejected
            })
            
        })

        /*describe("refund", ()=>{

            let orderID3 = web3.utils.asciiToHex("x23d33sdgdp")
            const expiration2 = new Date(moment().subtract(2, 'days').unix()).getTime()       // set expiration to 2 days before
            let refund

            beforeEach(async()=>{
                await htlc1400.openOrder(orderID3, secret1, hash1, classA, investor2, tokens(5), expiration2, data, {from: issuer})         // expired order
                
            })

            describe("before refund", ()=>{

                it("updates the htlc's and issuer's balance after order was placed", async()=>{

                    const htlcBalance = await tangleSeurityToken.balanceOfByPartition(classA, htlc1400.address)
                    const issuerBalance = await tangleSeurityToken.balanceOfByPartition(classA, issuer)
                    htlcBalance.toString().should.be.equal(tokens(10).toString(), "the htlc balance was incremented")
                    issuerBalance.toString().should.be.equal(tokens(90).toString(), "the htlc balance was incremented")
                
                })

                it("checks that order state is 'OPEN' ", async()=>{
                    const order = await htlc1400.checkOrder(orderID3)
                    order._orderState.toString().should.be.equal(swapState.OPEN, "the order state is 'OPEN' ")
                })

            })

            describe("after refund", ()=>{

                beforeEach(async()=>{
                    refund = await htlc1400.refund(orderID3)
                })

                it("refunds the issuer and updates the htlc and issuer's balance", async()=>{
                    const htlcBalance = await tangleSeurityToken.balanceOfByPartition(classA, htlc1400.address)
                    const issuerBalance = await tangleSeurityToken.balanceOfByPartition(classA, issuer)
                    htlcBalance.toString().should.be.equal(tokens(5).toString(), "the htlc balance was incremented")
                    issuerBalance.toString().should.be.equal(tokens(95).toString(), "the htlc balance was incremented")
                })

                it("checks that order state has been set to 'EXPIRED' ", async()=>{

                    const expiredOrder = await htlc1400.checkOrder(orderID3)
                    expiredOrder._orderState.toString().should.be.equal(swapState.EXPIRED, "the order state has 'EXPIRED' ")
                
                })

                it("emits the refund order event", ()=>{
                    refund.logs[0].event.should.be.equal("RefundOrder", "it emits the RefundOrder event")
                })
            })

           

            

        })

        describe("order checking", ()=>{

            it("checks valid orders", async()=>{
                const validOrder = await htlc1400.checkOrder(orderID)
                validOrder._orderState.toString().should.be.equal(swapState.OPEN)
            })

            it("fails to check invalid orders", async()=>{
                await htlc1400.checkOrder(web3.utils.asciiToHex("x23dfdbvsdgdp")).should.be.rejected
            })

        })*/


    })

    
    
   
})