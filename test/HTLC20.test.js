require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ETHER_ADDRESS, tokens, swapState, expire, expired, stringToHex, hashSecret, setToken, reverts} = require("./helper.js")

//  connect to the smart contract

const HTLC20 = artifacts.require("./HTLC20")
const ERC20_USDT = artifacts.require("./ERC20")     // this erc20 token will be represented as usdt
const ERC1400 = artifacts.require("./ERC1400")


/**
 * tangleAdministrator represents the issuer/regulator/adminstrator of tangl security token
 * reitAdministrator represents the issuer/regulator/adminstrator of reit security token
 * USDT_MARKET represents the market where usdt will be issued to the investors
 */

contract("HTLC20", ([htlc20Deployer, tanglAdministrator, reitAdministrator, investor1, investor2, USDT_MARKET])=>{

    let htlc20 
    let erc20
    let tanglSecurityToken
    let reitSecurityToken
    let secret_phrase = "anonymous"
    let secretHash = hashSecret(secret_phrase).secretHash
    let secretHex = hashSecret(secret_phrase).secretHex
    let orderID = stringToHex("x23dvsdgd").hex
    let expiration = expire(1)                                              // expiration will be present time + 1 day
    let price = tokens(1000)                                                // price of the asset
    let amount = tokens(10)                                                 // quantity of asset to be issued


    let classA = stringToHex("CLASS A")
    let classB = stringToHex("CLASS B")

    
    
    
    let tanglTokenDetails = setToken("TANGL", "TAN", 18, 0, [classA.hex,classB.hex])
    let reitTokenDetails = setToken("Real Estate Investment Trust", "REIT", 18, 0, [classA.hex,classB.hex])

    beforeEach(async()=>{


        /**
         * Deploy the USDT in the USDT market so that investors can be issued usdt from the market
         * Deploy the HTLC20 contract which will be used by all security token administrator to issue and track the DVP for the security token asset
         * Deploy a security token by a tangl administrator which will be used to handle DVP for the tangl asset
         * Deploy a security token by an reit administrator which will be used to handle DVP for the reit asset
         */

        
        erc20 = await ERC20_USDT.new("US Dollars Tether", "USDT", {from: USDT_MARKET})
        htlc20 = await HTLC20.new(erc20.address, {from: htlc20Deployer})
        tanglSecurityToken = await ERC1400.new(tanglTokenDetails.name, tanglTokenDetails.symbol, tanglTokenDetails.decimal, tanglTokenDetails.totalSupply, tanglTokenDetails.shareClass, {from: tanglAdministrator})
        reitSecurityToken = await ERC1400.new(reitTokenDetails.name, reitTokenDetails.symbol, reitTokenDetails.decimal, reitTokenDetails.totalSupply, reitTokenDetails.shareClass, {from: reitAdministrator})

    })    


    describe("Contract deployment", ()=>{

        it("has a contract address", ()=>{

            htlc20.address.should.be.not.equal("", "the htlc contract for the erc20 token has an address")
            erc20.address.should.not.be.equal("", "the erc20_usdt has a contract address")
            tanglSecurityToken.address.should.not.be.equal("", "tangle security token has a contract address")
            reitSecurityToken.address.should.not.be.equal("", "reit security token has a contract address")

        })

    })

    describe("open order", ()=>{

        let tangleOpenOrder
        let reitOpenOrder
        

        beforeEach(async()=>{

            tangleOpenOrder = await htlc20.openOrder(orderID, investor1, erc20.address, tanglSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA.hex, {from: tanglAdministrator})
            reitOpenOrder = await htlc20.openOrder(orderID, investor1, erc20.address, reitSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA.hex, {from: reitAdministrator})
        })

        /*describe("successful open order", ()=>{

            let tanglCheckOrder
            let reitCheckOrder

            beforeEach(async()=>{
                tanglCheckOrder = await htlc20.checkOrder(orderID, tanglSecurityToken.address)
                reitCheckOrder = await htlc20.checkOrder(orderID, reitSecurityToken.address)
            })

            describe("reit open order test", ()=>{

                it("emits the open order event", ()=>{
                    reitOpenOrder.logs[0].event.should.be.equal("OpenedOrder", "it emits the open order event")
                })
    
                it("changes the swap state from INVALID to OPEN", ()=>{
                    reitCheckOrder._orderState.toString().should.be.equal(swapState.OPEN, "it is an open order")
                })
    
                it("registers the correct order information", ()=>{
                    reitCheckOrder._amount.toString().should.be.equal(tokens(1000).toString(), "it registers the correct price")
                    reitCheckOrder._investor.should.be.equal(investor1, "it registers the investor needed to fund this order")
                    reitCheckOrder._issuer.should.be.equal(reitAdministrator, "the reit adminstrator is the recipient of the order")
                })
            })

            describe("tangl open order test", ()=>{

                it("emits the open order event", ()=>{
                    tangleOpenOrder.logs[0].event.should.be.equal("OpenedOrder", "it emits the open order event")
                })
    
                it("changes the swap state from INVALID to OPEN", ()=>{
                    tanglCheckOrder._orderState.toString().should.be.equal(swapState.OPEN, "it is an open order")
                })
    
                it("registers the correct order information", ()=>{
                    tanglCheckOrder._amount.toString().should.be.equal(tokens(1000).toString(), "it registers the correct price")
                    tanglCheckOrder._investor.should.be.equal(investor1, "it registers the investor needed to fund this order")
                    tanglCheckOrder._issuer.should.be.equal(tanglAdministrator, "the tangle adminstrator is the recipient of the order")
                })
            })      

        })*/

        /*describe("failed open order", ()=>{

            it("fails to open order for an existing order ID", async()=>{
                await htlc20.openOrder(orderID, investor1, erc20.address, tanglSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA.hex, {from: tanglAdministrator}).should.be.rejectedWith(reverts.EXISTING_ID)
            })

            it("fails to open order if the tanglAdministrator tries to open an order with a secret that is incompatible with the provided hash", async()=>{
                
                const orderID2 = stringToHex("x23dlsdgd").hex
                await htlc20.openOrder(orderID2, investor1, erc20.address, tanglSecurityToken.address, price, amount, expiration, secretHash, hashSecret("avalanche").secretHex, classA.hex, {from: tanglAdministrator}).should.be.rejectedWith(reverts.INVALID_SECRET)
            })

        })*/

        describe("funding order", ()=>{

            let fundedTangleOrder
            let tanglCheckOrder


            /**
             * Investor purchases usdt from an exchange/escrow
             * Investor approves the htlc contract to move the tokens from his wallet
             * Investor funds the order. The contract moves the token and deposits it because it has been approved
             */

            beforeEach(async()=>{

                await erc20.transfer(investor1, tokens(2000), {from: USDT_MARKET})                           // investor purchases usdt token from escrow/exchanges/p2p/any secondary market
                await erc20.approve(htlc20.address, tokens(1000), {from: investor1})    // investor approves the htlc contract to move the tokens from his wallet to fund the order
                
            
            })

            describe("successful funding", ()=>{


                beforeEach(async()=>{

                    fundedTangleOrder = await htlc20.fundOrder(orderID, tanglSecurityToken.address, {from: investor1})
                    tanglCheckOrder = await htlc20.checkOrder(orderID, tanglSecurityToken.address)                            // check the order after funding
                })

                it("emits the funded event", ()=>{
                    fundedTangleOrder.logs[0].event.should.be.equal("Funded", "it emits the Funded event after an investor funds an order with his payment")
                })
    
                it("changes the order's fund status to true after funding", async()=>{
                    tanglCheckOrder._funded.should.be.equal(true, "the order fund status was changed to true")
                    const usdtBalance = await erc20.balanceOf(htlc20.address)
                    usdtBalance.toString().should.be.equal(tanglCheckOrder._amount.toString(), "the contract was funded")
                })

            })

            describe("failed funding", ()=>{

                it("fails to fund any order that isn't OPEN", async()=>{
                    const orderID3 = stringToHex("xg23dlsdgd").hex
                    await htlc20.fundOrder(orderID3, tanglSecurityToken.address, {from: investor1}).should.be.rejectedWith(reverts.NOT_OPENED)
                })

                it("fails to fund any order if attempted by the wrong investor of the order", async()=>{
                    await htlc20.fundOrder(orderID, tanglSecurityToken.address, {from: investor2}).should.be.rejectedWith(reverts.INVALID_CALLER)
                })

                it("fails to fund an already funded order", async()=>{

                    await htlc20.fundOrder(orderID, tanglSecurityToken.address, {from: investor1})      //  fund the order

                    //  attempted funding again
                    await htlc20.fundOrder(orderID, tanglSecurityToken.address, {from: investor1}).should.be.rejectedWith(reverts.FUNDED)
                })

            })

                 
        })

        /*describe("failed refund before expiration", ()=>{
            
            it("should revert if refund is attempted before the expiration period", async()=>{
                await htlc20.refund(orderID, {from: investor1}).should.be.rejected
            })

        })*/


        /*describe("withdrawal by tanglAdministrator", ()=>{

            let withdrawal 
            let tanglCheckOrder

            beforeEach(async()=>{

                await erc20.transfer(investor1, tokens(2000), {from: USDT_MARKET})           // investor purchases usdt token from escrow/exchanges/p2p/any secondary market
                await erc20.approve(htlc20.address, tokens(1000), {from: investor1})  // investor approves the htlc contract to move the tokens from his wallet to fund the order
                await htlc20.fundOrder(orderID, tanglSecurityToken.address, {from: investor1})
                withdrawal = await htlc20.issuerWithdrawal(orderID, secretHex, tanglSecurityToken.address, {from:tanglAdministrator})
                tanglCheckOrder = await htlc20.checkOrder(orderID, tanglSecurityToken.address)

            })
            

            describe("successful withdrawal", ()=>{

                it("transfers the payment token to the tanglAdministrator", async()=>{
                    const tanglAdministratorBalance = await erc20.balanceOf(tanglAdministrator)
                    const htlcBalance = await erc20.balanceOf(htlc20.address)
                    htlcBalance.toString().should.be.equal("0", "htlc released the token")
                    tanglAdministratorBalance.toString().should.be.equal(price.toString(), "the issuer withdrew the payment")
                })

                it("emits the closed order event and the data associated with it after successful withdrawal by the tanglAdministrator of the security token", async()=>{
                    withdrawal.logs[0].event.should.be.equal("ClosedOrder", "tangl administrator withdraws and closes the order")
                    withdrawal.logs[0].args._investor.should.be.equal(investor1, "it emits the investor of the order")
                    web3.utils.hexToUtf8(withdrawal.logs[0].args._partition).should.be.equal("CLASS A", "it emits the partition of the data")

                })

                it("made the secret visible to the investor, hence the investor can withdraw the security token with the secret", ()=>{
                    secret_phrase.should.be.equal(web3.utils.hexToUtf8(tanglCheckOrder._secretKey), "it reveals the correct secret to the investor")   
                })

                it("should have a closed order state", ()=>{
                    tanglCheckOrder._orderState.toString().should.be.equal(swapState.CLOSED, "the order is closed after withdrawal by the tangl administrator")
                })

               

            })

        })*/

    })

    describe("expired order", ()=>{

        let orderID2 = stringToHex("x23d33sdgdp").hex
        const expiredDate = expired(2)       // set expiration to 2 days before
        let refund

        beforeEach(async()=>{

            await htlc20.openOrder(orderID2, investor1, erc20.address, reitSecurityToken.address,  price, amount, expiredDate, secretHash, secretHex, classA.hex, {from: reitAdministrator})
            await erc20.transfer(investor1, tokens(2000), {from: USDT_MARKET})                           // investor purchases usdt token from escrow/exchanges/p2p/any secondary market
            await erc20.approve(htlc20.address, tokens(1000), {from: investor1})    // investor approves the htlc contract to move the tokens from his wallet to fund the order
            funded = await htlc20.fundOrder(orderID2, reitSecurityToken.address, {from: investor1})            // investor funds the order
        })

        describe("the order is opened", ()=>{

            it("check the order to be opened", async()=>{
                const reitCheckOrder = await htlc20.tanglCheckOrder(orderID2, reitSecurityToken.address)
                tanglCheckOrder._orderState.toString().should.be.equal(swapState.OPEN, "the order is opened")
            })

        })

        describe("withdrawal fails for expired order", ()=>{

            it("should revert if the administrator tries to withdraw an opened order that is expired", async()=>{
                await htlc20.issuerWithdrawal(orderID2, secretHex, reitSecurityToken.address, {from: reitAdministrator}).should.be.rejected
            })

        })

        describe("refund", ()=>{

            let reitCheckOrder

            beforeEach(async()=>{
                refund = await htlc20.refund(orderID2, reitAdministrator, {from: investor1})
                reitCheckOrder = await htlc20.checkOrder(orderID2, reitSecurityToken.address)

            })

            it("should have an expired order state after refund", ()=>{
                tanglCheckOrder._orderState.toString().should.be.equal(swapState.EXPIRED, "the order state changes to EXPIRED after refund")
            })

            it("refunds the investor's payment to the investor's wallet", async()=>{

                const balance = await erc20.balanceOf(investor1)
                balance.toString().should.be.equal(tokens(2000).toString(), "it refunds the deposited token to the investor's wallet")
                refund.logs[0].event.should.be.equal("RefundedOrder", "it emits the refund event")


            })


            it("should fail for every attempted withdrawal from tanglAdministrator on any refunded order", async()=>{

                await htlc20.issuerWithdrawal(orderID2, secretHex, reitAdministrator, {from: tanglAdministrator}).should.be.rejected

            })

            

            

        })

    })

})