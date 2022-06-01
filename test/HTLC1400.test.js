require("chai")
    .use(require("chai-as-promised"))
    .should()


const { ETHER_ADDRESS, tokens, swapState, BYTES_0, setToken, 
    stringToHex, expire, expired, hashSecret, tanglAdministratorPrivkey, 
    reitAdministratorPrivKey, certificate} = require("./helper.js")

const HTLC1400 = artifacts.require("./HTLC1400")
const ERC1400 = artifacts.require("./ERC1400")




contract("HTLC1400", ([tanglAdministrator, reitAdministrator, investor_Dami, investor_Jeff])=>{

    
    let htlc1400
    let tanglSecurityToken          //  security token called tangl
    let reitSecurityToken                        //  security token for real estate investment trust

    let classA = stringToHex("CLASS A")
    let classB = stringToHex("CLASS B")

    
    
    
    let tanglTokenDetails = setToken("TANGL", "TAN", 18, 0, [classA.hex,classB.hex])
    let reitTokenDetails = setToken("Real Estate Investment Trust", "REIT", 18, 0, [classA.hex,classB.hex])
    
    /**
     * Define the data of the issuers and onboarded investors
     * These data will be used to generate certificate for issuance, transfer and redemption of tokens
    */

     let tanglAdministratorData = {
            
        firstName: "tangl administrator",
        lastName: "tangl administrator",
        location: "New Yoke, London",
        walletAddress: tanglAdministrator

    }


    let reitAdministratorData = {
            
        firstName: "reit administrator",
        lastName: "reit administrator",
        location: "New Yoke, London",
        walletAddress: reitAdministrator

    }

    let investorDamiData = {

        firstName: "Dami",
        lastName: "Ogunkeye",
        location: "New Yoke, London",
        walletAddress: investor_Dami

    }


    let investorJeffData = {

        firstName: "Jeff",
        lastName: "Chuka",
        location: "New Yoke, London",
        walletAddress: investor_Jeff

    }

    let tanglDomainData
    let reitDomainData


    let htlcData
    const salt = "0xa99ee9d3aab69713b85beaef7f222d0304b9c35e89072ae3c6e0cbabcccacc0a"

    

    beforeEach(async()=>{

        

        //  create security tokens for TANGL and REIT

        tanglSecurityToken = await ERC1400.new(tanglTokenDetails.name, tanglTokenDetails.symbol, tanglTokenDetails.decimal, {from: tanglAdministrator})
        reitSecurityToken = await ERC1400.new(reitTokenDetails.name, reitTokenDetails.symbol, reitTokenDetails.decimal, {from: reitAdministrator})

        /**
         * Set the tokens to be issuable
         */
        await tanglSecurityToken.setIssuable(true, {from: tanglAdministrator})
        await reitSecurityToken.setIssuable(true, {from: reitAdministrator})


        htlc1400 = await HTLC1400.new()


        htlcData = {

            firstName : "HTLC",
            lastName: "HTLC",
            location: "Blockchain",
            walletAddress: htlc1400.address
        }

        reitDomainData = {
        
            name: reitTokenDetails.name,
            version: "1",
            chainId: 1337,
            verifyingContract: reitSecurityToken.address,
            salt: salt //"0x0daa2a09fd91f1dcd75517ddae4699d3ade05dd587e55dc861fe82551d2c0b66"
    
        }

        tanglDomainData = {

            name: tanglTokenDetails.name,
            version: "1",
            chainId: 1337,
            verifyingContract: tanglSecurityToken.address,
            salt: salt //"0x0daa2a09fd91f1dcd75517ddae4699d3ade05dd587e55dc861fe82551d2c0b66"
    
        }
    
        
    })


    describe("Contract deployment", ()=>{

        it("has a contract address", ()=>{

           
            htlc1400.address.should.be.not.equal("", "the htlc contract for the security token has an address")
            tanglSecurityToken.address.should.not.be.equal("", "the security token contract has an address")
            reitSecurityToken.address.should.not.be.equal("", "it has a contract address")

        })

    })

    describe("htlc1400", ()=>{

        let secretPhrase1 = "anonymous"
        let secretPhrase2 = "avalanche"
        let orderID = stringToHex("x23dvsdgd").hex

        //  initialize the order
        let createTanglOrder
        let createReitOrder

        
        let secretHex1= hashSecret(secretPhrase1).secretHex
        let secretHash1 = hashSecret(secretPhrase1).secretHash


        let secretHex2 = hashSecret(secretPhrase2).secretHex
        let secretHash2 = hashSecret(secretPhrase2).secretHash

        let expiration = expire(1)                      // expiration will be present time + 1 day

        beforeEach(async()=>{

            //  issuance cert

            let issuanceCert1 = await certificate(tanglAdministratorData, tanglAdministratorData, 100, 1, tanglDomainData, tanglAdministratorPrivkey)
            let issuanceCert2 = await certificate(reitAdministratorData, reitAdministratorData, 100, 2, reitDomainData, reitAdministratorPrivKey)


            //  issuers issue tokens to themselves before depositing to the htlc contract

            await tanglSecurityToken.issueByPartition(classA.hex, tanglAdministrator, 100, issuanceCert1, {from: tanglAdministrator})
            await reitSecurityToken.issueByPartition(classB.hex, reitAdministrator, 100, issuanceCert2, {from: reitAdministrator})

            /**
             * 
             * issuers authorize the htlc contract as an operator. This implies that the htlc contract will automatically move the tokens
             * from their wallets once the order is created
             * 
             * */  

            await tanglSecurityToken.authorizeOperator(htlc1400.address, {from: tanglAdministrator})       //set the htlc contract to be an operator
            await reitSecurityToken.authorizeOperator(htlc1400.address, {from: reitAdministrator})       //set the htlc contract to be an operator

            const tanglAdministratorTransferCert = await certificate(tanglAdministratorData, htlcData, BigInt(tokens(5)), 1, tanglDomainData, tanglAdministratorPrivkey)
            const reitAdministratorTransferCert = await certificate(reitAdministratorData, htlcData, BigInt(tokens(5)), 1, reitDomainData, reitAdministratorPrivKey)


            createTanglOrder = await htlc1400.openOrder(orderID, secretHex1, secretHash1, classA.hex, investor_Dami, tanglSecurityToken.address, tokens(5), expiration, tanglAdministratorTransferCert, {from: tanglAdministrator})
            createReitOrder = await htlc1400.openOrder(orderID, secretHex1, secretHash1, classB.hex, investor_Jeff, reitSecurityToken.address, tokens(5), expiration, reitAdministratorTransferCert, {from: reitAdministrator})
            
        })


        describe("successful open orders", ()=>{
            
            it("should register the htlc contract address as an operator", async ()=>{

                const isOperator = await tanglSecurityToken.isOperator(htlc1400.address, tanglAdministrator)
                isOperator.should.be.equal(true, "the htlc for the security token is an operator")
                
            })

            it("opens order", async()=>{
                
                createTanglOrder.logs[0].event.should.be.equal("OpenedOrder", "it emits the Open Order event")

            })

            it("updates the balance of the htlc contract", async()=>{

                const htlcTanglBalance = await tanglSecurityToken.balanceOfByPartition(classA.hex, htlc1400.address)
                const htlcReitBalance = await reitSecurityToken.balanceOfByPartition(classB.hex, htlc1400.address)

                htlcTanglBalance.toString().should.be.equal(tokens(5).toString(), "the Tangl token was deposited to the htlc contract")
                htlcReitBalance.toString().should.be.equal(tokens(5).toString(), "the Reit token was deposited to the htlc contract")
            })

            it("updates the balance of the issuer", async()=>{

                const issuerBalance = await tanglSecurityToken.balanceOfByPartition(classA.hex, tanglAdministrator)
                issuerBalance.toString().should.be.equal(tokens(95).toString(), "the token was transferred from the issuer's wallet")
            })

            it("emits the correct open order event data", ()=>{
                
                createTanglOrder.logs[0].args._investor.should.be.equal(investor_Dami, "it emits the correct recipient address of the security token")
                createTanglOrder.logs[0].args._amount.toString().should.be.equal(tokens(5).toString(), "it emits the value deposited")
                createTanglOrder.logs[0].args._secretHash.should.be.equal(secretHash1, "it emits the hash of the open order")
                createTanglOrder.logs[0].args._expiration.toString().should.be.equal(expiration.toString(), "it emits the day and time the withdrawal expires")
                createTanglOrder.logs[0].args._securityToken.should.be.equal(tanglSecurityToken.address, "it emits the security token address used to create the order")
                
            })
        })

        /*describe("failed open order", ()=>{

            it("fails to open order with an existing order ID", async()=>{
                await htlc1400.openOrder(orderID, secretHex1, secretHash1, classA, investor_Dami, tanglSecurityToken.address, tokens(5), expiration, data, {from: issuer}).should.be.rejected
            })

            it("fails to open an order if the secret provided by the issuer doesn't match the hash", async()=>{

                const orderID2 = web3.utils.asciiToHex("x23dvsdgd5t")
                await htlc1400.openOrder(orderID2, secretHex2, secretHash1, classA, investor_JeffrityToken.address, tokens(5), expiration, data, {from: issuer}).should.be.rejected
            })

            it("fails to open orders for expired dates", async()=>{
                await htlc1400.openOrder(stringToHex("4t5d").hex, secretHex1, secretHash1, classA, investor_Dami, tanglSecurityToken.address, expired(1), 10000, data, {from: issuer}).should.be.rejected
            })

        })

        describe("successful withdrawal", ()=>{

            let successfulTanglWithdrawal
            let successfulReitWithdrawal

            beforeEach(async()=>{
                successfulTanglWithdrawal = await htlc1400.recipientWithdrawal(orderID, secretHex1, tanglSecurityToken.address, {from: investor_Dami})
                successfulReitWithdrawal = await htlc1400.recipientWithdrawal(orderID, secretHex1, reitSecurityToken.address, {from: investo    })

            it("emits the Closed Order event", ()=>{
                successfulTanglWithdrawal.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event")
                successfulReitWithdrawal.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event")
            })

            it("updates the balance of the investor and the htlc contract", async()=>{

                //  investors balance after withdrawal
                const investorTanglBalance = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Dami)
                const investorReitBalance = await reitSecurityToken.balanceOfByPartition(classB.hex, investo        //  htlc contract balance after withdrawal by investors

                const htlcTanglBalance = await tanglSecurityToken.balanceOfByPartition(classA.hex, htlc1400.address)
                const htlcReitBalance = await reitSecurityToken.balanceOfByPartition(classB.hex, htlc1400.address)

                investorTanglBalance.toString().should.be.equal(tokens(5).toString(), "the token was transferred to the investor's wallet after providing the valid secret")
                investorReitBalance.toString().should.be.equal(tokens(5).toString(), "the token was transferred to the investor's wallet after providing the valid secret")

                htlcTanglBalance.toString().should.be.equal(tokens(0).toString(), "the token was removed from the htlc contract address to the investor's wallet")
                htlcReitBalance.toString().should.be.equal(tokens(0).toString(), "the token was removed from the htlc contract address to the investor's wallet")


            })

            it("fetches the order details", async()=>{

                const order = await htlc1400.checkOrder(orderID, tanglSecurityToken.address)
                order._investor.should.be.equal(investor_Dami, "it fetched the recipient of the order")
                order._issuer.should.be.equal(issuer, "it fetched the issuer of the order")
                order._amount.toString().should.be.equal(tokens(5).toString(),"it fetched the amount in the order")
                order._expiration.toString().should.be.equal(expiration.toString(),"it fetched the expiration of the order")
                order._orderState.toString().should.be.equal(swapState.CLOSED, "it fetched the updated order state which is closed")
                order._securityTokenAddress.should.be.equal(tanglSecurityToken.address, "it returns the security token registered in the order")
                
            })

        })*/

         /**
         * To test for failed withdrawal, comment out the require statement that reverts opening orders for expired time
         */

        /*describe("failed withdrawal", ()=>{

            let orderID2 = stringToHex("x23d33sdgdp")

            const expiration2 = expired(2)       // set expiration to 2 days before
            
            
            beforeEach(async()=>{
                createTanglOrder2 = await htlc1400.openOrder(orderID2.hex, secretHex1, secretHash1, classA.hex, investor_JeffrityToken.address, tokens(5), expiration2, data, {from: issuer})
            })


            it("fails to withdraw because the withdrawal date has expired", async()=>{
                await htlc1400.recipientWithdrawal(orderID2.hex, secretHex1, tanglSecurityToken.address, {from: investor_Jeffe.rejected
            })

            it("fails due to withdrawal by an invalid recipient of a particular order", async()=>{
                await htlc1400.recipientWithdrawal(orderID.hex, secretHex1, tanglSecurityToken.address, {from: investor_Jeffe.rejected
            })

            it("fails due to withdrawal of an id that isn't opened", async()=>{
                await htlc1400.recipientWithdrawal(stringToHex("35trgd").hex, secretHex1, tanglSecurityToken.address, {from: investor_Dami}).should.be.rejected
            })

            it("fails to withdraw if an investor tries to use his order ID to withdraw from another security token order of same ID", async()=>{
                await htlc1400.recipientWithdrawal(orderID.hex, secretHex1, reitSecurityToken.address, {from: investor_Dami}).should.be.rejected
            })
            
        })*/

        /**
         * To test for refund, comment out the require statement that reverts opening orders for expired time
         */

        /*describe("refund", ()=>{

            let orderID3 = stringToHex("x23d33sdgdp").hex
            const expiration2 = expired(2)       // set expiration to 2 days before
            let refund

            beforeEach(async()=>{
                await htlc1400.openOrder(orderID3, secretHex1, secretHash1, classA.hex, investor_JeffrityToken.address, tokens(5), expiration2, data, {from: issuer})         // expired order
                
            })

            describe("before refund", ()=>{

                it("updates the htlc's and issuer's balance after order was placed", async()=>{

                    const htlcTanglBalance = await tanglSecurityToken.balanceOfByPartition(classA.hex, htlc1400.address)
                    const issuerTanglBalance = await tanglSecurityToken.balanceOfByPartition(classA.hex, issuer)

                    htlcTanglBalance.toString().should.be.equal(tokens(10).toString(), "the htlc balance was incremented")
                    issuerTanglBalance.toString().should.be.equal(tokens(90).toString(), "the htlc balance was incremented")
                
                })

                it("checks that order state is 'OPEN' ", async()=>{
                    const order = await htlc1400.checkOrder(orderID3, tanglSecurityToken.address)

                    order._orderState.toString().should.be.equal(swapState.OPEN, "the order state is 'OPEN' ")
                })

            })

            describe("after refund", ()=>{

                beforeEach(async()=>{
                    refund = await htlc1400.refund(orderID3, tanglSecurityToken.address, {from:issuer})
                })

                it("refunds the issuer and updates the htlc and issuer's balance", async()=>{
                    const htlcTanglBalance = await tanglSecurityToken.balanceOfByPartition(classA.hex, htlc1400.address)
                    const issuerTanglBalance = await tanglSecurityToken.balanceOfByPartition(classA.hex, issuer)

                    //  refund the issuer

                    htlcTanglBalance.toString().should.be.equal(tokens(5).toString(), "the htlc balance was incremented")
                    issuerTanglBalance.toString().should.be.equal(tokens(95).toString(), "the htlc balance was incremented")
                })

                it("checks that order state has been set to `EXPIRED` after successful refund", async()=>{

                    const expiredOrder = await htlc1400.checkOrder(orderID3, tanglSecurityToken.address)
                    expiredOrder._orderState.toString().should.be.equal(swapState.EXPIRED, "the order state has 'EXPIRED' ")
                
                })

                it("emits the refund order event", ()=>{
                    refund.logs[0].event.should.be.equal("RefundOrder", "it emits the RefundOrder event")
                })
            })

            describe("failed refund", ()=>{

                it("should fail to refund orders that is yet to be expired", async()=>{
                    await htlc1400.refund(orderID, tanglSecurityToken.address, {from:issuer}).should.be.rejected
                })

                it("fails to refund if called by an invalid address", async()=>{
                    await htlc1400.refund(orderID, tanglSecurityToken.address, {from:investor_Dami}).should.be.rejected
                })

                it("fails to refund an invalid order", async()=>{
                    await htlc1400.refund(stringToHex("dfgdfdd").hex, tanglSecurityToken.address, {from:issuer}).should.be.rejected
                })
    
            })

           

            

        })*/

        /*describe("order checking", ()=>{

            it("checks valid orders", async()=>{
                const validOrder = await htlc1400.checkOrder(orderID, tanglSecurityToken.address)
                validOrder._orderState.toString().should.be.equal(swapState.OPEN)
            })

            it("fails to check invalid orders", async()=>{
                await htlc1400.checkOrder(stringToHex("x23dfdbvsdgdp").hex, tanglSecurityToken.address).should.be.rejected
            })

        })*/


    })

    
    
   
})