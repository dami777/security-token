require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ethers } = require("ethers")
const { ETHER_ADDRESS, tokens, signer, data, signature, ethHash, wait, swapState, BYTES_0, setToken, stringToHex, expire, expired, hash, hashSecret} = require("./helper.js")
const moment = require("moment");





const HTLC1400 = artifacts.require("./HTLC1400")
const ERC1400 = artifacts.require("./ERC1400")




contract("HTLC1400", ([issuer, investor1, investor2, investor3])=>{

    
    let htlc1400
    let tangleSecurityToken          //  security token called tangle
    let reit                        //  security token for real estate investment trust

    let classA = stringToHex("CLASS A")
    let classB = stringToHex("CLASS B")

    
    
    
    let tangleTokenDetails = setToken("TANGLE", "TAN", 18, 0, [classA.hex,classB.hex])
    let reitTokenDetails = setToken("Real Estate Investment Trust", "REIT", 18, 0, [classA.hex,classB.hex])
    
    
    

    beforeEach(async()=>{

        //  create security tokens for TANGL and REIT

        tangleSecurityToken = await ERC1400.new(tangleTokenDetails.name, tangleTokenDetails.symbol, tangleTokenDetails.decimal, tangleTokenDetails.totalSupply, tangleTokenDetails.shareClass)
        reit = await ERC1400.new(reitTokenDetails.name, reitTokenDetails.symbol, reitTokenDetails.decimal, reitTokenDetails.totalSupply, reitTokenDetails.shareClass)

        htlc1400 = await HTLC1400.new()

        await tangleSecurityToken.setController(signer)
        await reit.setController(signer)
    
        
    })


    describe("Contract deployment", ()=>{

        it("has a contract address", ()=>{

           
            htlc1400.address.should.be.not.equal("", "the htlc contract for the security token has an address")
            tangleSecurityToken.address.should.not.be.equal("", "the security token contract has an address")
            reit.address.should.not.be.equal("", "it has a contract address")

        })

    })

    describe("htlc1400", ()=>{

        let secretPhrase1 = "anonymous"
        let secretPhrase2 = "avalanche"
        let orderID = stringToHex("x23dvsdgd").hex
        let createOrder

        
        let { secretHex1, secretHash1} = hashSecret(secretPhrase1)
        let { secretHex2, secretHash2} = hashSecret(secretPhrase2)
        let expiration = expire(1)                      // expiration will be present time + 1 day

        beforeEach(async()=>{

            await tangleSecurityToken.issueByPartition(classA.hex, issuer, 100, data)
            await tangleSecurityToken.authorizeOperator(htlc1400.address)       //set the htlc contract to be an operator
            createOrder = await htlc1400.openOrder(orderID, secretHex1, secretHash1, classA.hex, investor1, tangleSecurityToken.address, tokens(5), expiration, data, {from: issuer})
            
        })


        describe("successful open orders", ()=>{
            
            it("should register the htlc contract address as an operator", async ()=>{

                const isOperator = await tangleSecurityToken.isOperator(htlc1400.address, issuer)
                isOperator.should.be.equal(true, "the htlc for the security token is an operator")
                
            })

            it("opens order", async()=>{
                
                createOrder.logs[0].event.should.be.equal("OpenedOrder", "it emits the Open Order event")

            })

            it("updates the balance of the htlc contract", async()=>{
                const htlcBalance = await tangleSecurityToken.balanceOfByPartition(classA.hex, htlc1400.address)
                htlcBalance.toString().should.be.equal(tokens(5).toString(), "the token was deposited to the htlc contract")
            })

            it("updates the balance of the issuer", async()=>{
                const issuerBalance = await tangleSecurityToken.balanceOfByPartition(classA.hex, issuer)
                issuerBalance.toString().should.be.equal(tokens(95).toString(), "the token was transferred from the issuer's wallet")
            })

            it("emits the correct open order event data", ()=>{
                createOrder.logs[0].args._investor.should.be.equal(investor1, "it emits the correct recipient address of the security token")
                createOrder.logs[0].args._amount.toString().should.be.equal(tokens(5).toString(), "it emits the value deposited")
                createOrder.logs[0].args._secretHash1.should.be.equal(secretHash1, "it emits the hash of the open order")
                createOrder.logs[0].args._expiration.toString().should.be.equal(expiration.toString(), "it emits the day and time the withdrawal expires")
                createOrder.logs[0].args._securityToken.should.be.equal(tangleSecurityToken.address, "it emits the security token address used to create the order")
                
            })
        })

        describe("failed open order", ()=>{

            it("fails to open order with an existing order ID", async()=>{
                await htlc1400.openOrder(orderID, secretHex1, secretHash1, classA, investor1, tangleSecurityToken.address, tokens(5), 10000, data, {from: issuer}).should.be.rejected
            })

            it("fails to open an order if the secret provided by the issuer doesn't match the hash", async()=>{

                const orderID2 = web3.utils.asciiToHex("x23dvsdgd5t")
                await htlc1400.openOrder(orderID2, secretHex2, secretHash1, classA, investor2, tangleSecurityToken.address, tokens(5), 10000, data, {from: issuer}).should.be.rejected
            })

        })

        describe("successful withdrawal", ()=>{

            let successfulWithDrawal

            beforeEach(async()=>{
                successfulWithDrawal = await htlc1400.recipientWithdrawal(orderID, secretHex1, tangleSecurityToken.address, {from: investor1})
            })

            it("emits the Closed Order event", ()=>{
                successfulWithDrawal.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event")
            })

            it("updates the balance of the investor and the htlc contract", async()=>{
                const investorBalance = await tangleSecurityToken.balanceOfByPartition(classA.hex, investor1)
                const htlcBalance = await tangleSecurityToken.balanceOfByPartition(classA.hex, htlc1400.address)

                investorBalance.toString().should.be.equal(tokens(5).toString(), "the token was transferred to the investor's wallet after providing the valid secret")
                htlcBalance.toString().should.be.equal(tokens(0).toString(), "the token was removed from the htlc contract address to the investor's wallet")

            })

            it("fetches the order details", async()=>{

                const order = await htlc1400.checkOrder(orderID, tangleSecurityToken.address)
                order._investor.should.be.equal(investor1, "it fetched the recipient of the order")
                order._issuer.should.be.equal(issuer, "it fetched the issuer of the order")
                order._amount.toString().should.be.equal(tokens(5).toString(),"it fetched the amount in the order")
                order._expiration.toString().should.be.equal(expiration.toString(),"it fetched the expiration of the order")
                order._orderState.toString().should.be.equal(swapState.CLOSED, "it fetched the updated order state which is closed")
                
            })

        })

        describe("failed withdrawal", ()=>{

            let orderID2 = stringToHex("x23d33sdgdp")
            const expiration2 = expired(2)       // set expiration to 2 days before
            
            
            beforeEach(async()=>{
                createOrder2 = await htlc1400.openOrder(orderID2.hex, secretHex1, secretHash1, classA.hex, investor2, tangleSecurityToken.address, tokens(5), expiration2, data, {from: issuer})
            })


            it("fails to withdraw because the withdrawal date has expired", async()=>{
                await htlc1400.recipientWithdrawal(orderID2.hex, secretHex1, tangleSecurityToken.address, {from: investor2}).should.be.rejected
            })

            it("fails due to withdrawal by an invalid recipient of a particular order", async()=>{
                await htlc1400.recipientWithdrawal(orderID.hex, secretHex1, tangleSecurityToken.address, {from: investor2}).should.be.rejected
            })

            it("fails due to withdrawal of an id that isn't opened", async()=>{
                await htlc1400.recipientWithdrawal(stringToHex("35trgd").hex, secretHex1, tangleSecurityToken.address, {from: investor1}).should.be.rejected
            })
            
        })

        /*describe("refund", ()=>{

            let orderID3 = web3.utils.asciiToHex("x23d33sdgdp")
            const expiration2 = new Date(moment().subtract(2, 'days').unix()).getTime()       // set expiration to 2 days before
            let refund

            beforeEach(async()=>{
                await htlc1400.openOrder(orderID3, secretPhrase1, secretHash1, classA, investor2, tokens(5), expiration2, data, {from: issuer})         // expired order
                
            })

            describe("before refund", ()=>{

                it("updates the htlc's and issuer's balance after order was placed", async()=>{

                    const htlcBalance = await tangleSecurityToken.balanceOfByPartition(classA, htlc1400.address)
                    const issuerBalance = await tangleSecurityToken.balanceOfByPartition(classA, issuer)
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
                    const htlcBalance = await tangleSecurityToken.balanceOfByPartition(classA, htlc1400.address)
                    const issuerBalance = await tangleSecurityToken.balanceOfByPartition(classA, issuer)
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