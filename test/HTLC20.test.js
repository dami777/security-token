require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ETHER_ADDRESS, tokens, swapState, expire, expired, stringToHex, hashSecret, setToken} = require("./helper.js")

//  connect to the smart contract

const HTLC20 = artifacts.require("./HTLC20")
const ERC20_USDT = artifacts.require("./ERC20")     // this erc20 token will be represented as usdt
const ERC1400 = artifacts.require("./ERC1400")

contract("HTLC20", ([issuer, investor1, investor2])=>{

    let htlc20 
    let erc20
    let tanglSecurityToken
    let secret_phrase = "anonymous"
    let secretHash = hashSecret(secret_phrase).secretHash
    let orderID = stringToHex("x23dvsdgd").hex
    let expiration = expire(1)                                              // expiration will be present time + 1 day
    let price = tokens(1000)                                                // price of the asset
    let amount = tokens(10)                                                 // quantity of asset to be issued


    let classA = stringToHex("CLASS A")
    let classB = stringToHex("CLASS B")

    
    
    
    let tanglTokenDetails = setToken("TANGL", "TAN", 18, 0, [classA.hex,classB.hex])

    beforeEach(async()=>{

        
        erc20 = await ERC20_USDT.new("US Dollars Tether", "USDT")
        htlc20 = await HTLC20.new(erc20.address)
        tanglSecurityToken = await ERC1400.new(tanglTokenDetails.name, tanglTokenDetails.symbol, tanglTokenDetails.decimal, tanglTokenDetails.totalSupply, tanglTokenDetails.shareClass)
        

    })    


    describe("Contract deployment", ()=>{

        it("has a contract address", ()=>{

            htlc20.address.should.be.not.equal("", "the htlc contract for the erc20 token has an address")
            erc20.address.should.not.be.equal("", "the erc20_usdt has a contract address")
            

        })

    })

    describe("open order", ()=>{

        let openOrder
        

        beforeEach(async()=>{

            openOrder = await htlc20.openOrder(orderID, investor1, erc20.address, tanglSecurityToken.address, price, amount, expiration, secretHash, secretBytes32, classA)

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
                await htlc20.openOrder(orderID, investor1, tokens(1000), expiration, secretHash, secretBytes32).should.be.rejected
            })

            it("fails to open order if the issuer tries to open an order with a secret that is incompatible with the provided hash", async()=>{
                
                const orderID2 = web3.utils.asciiToHex("x23dlsdgd")
                await htlc20.openOrder(orderID2, investor1, tokens(1000), expiration, secretHash, web3.utils.asciiToHex("avalanche")).should.be.rejected
            })

        })

        describe("funding order", ()=>{

            let funded
            let checkOrder

            beforeEach(async()=>{
                await erc20.transfer(investor1, tokens(2000))                           // investor purchases usdt token from escrow/exchanges/p2p/any secondary market
                await erc20.approve(htlc20.address, tokens(1000), {from: investor1})    // investor approves the htlc contract to move the tokens from his wallet to fund the order
                funded = await htlc20.fundOrder(orderID, {from: investor1})
                checkOrder = await htlc20.checkOrder(orderID)                            // check the order after funding
            })

            describe("successful funding", ()=>{

                it("emits the funded event", ()=>{
                    funded.logs[0].event.should.be.equal("Funded", "it emits the Funded event after an investor funds an order with his payment")
                })
    
                it("changes the order's fund status to true after funding", async()=>{
                    checkOrder._funded.should.be.equal(true, "the order fund status was changed to true")
                    const usdtBalance = await erc20.balanceOf(htlc20.address)
                    usdtBalance.toString().should.be.equal(checkOrder._amount.toString(), "the contract was funded")
                })

            })

            describe("failed funding", ()=>{

                it("fails to fund any order that isn't OPEN", async()=>{
                    const orderID3 = web3.utils.asciiToHex("xg23dlsdgd")
                    await htlc20.fundOrder(orderID3, {from: investor1}).should.be.rejected
                })

                it("fails to fund any order if attempted by the wrong investor of the order", async()=>{
                    await htlc20.fundOrder(orderID, {from: investor2}).should.be.rejected
                })

                it("fails to fund an already funded order", async()=>{
                    await htlc20.fundOrder(orderID, {from: investor1}).should.be.rejected
                })

            })

                 
        })

        describe("failed refund before expiration", ()=>{
            
            it("should revert if refund is attempted before the expiration period", async()=>{
                await htlc20.refund(orderID, {from: investor1}).should.be.rejected
            })

        })


        describe("withdrawal by issuer", ()=>{

            let withdrawal 
            let checkOrder

            beforeEach(async()=>{

                await erc20.transfer(investor1, tokens(2000))           // investor purchases usdt token from escrow/exchanges/p2p/any secondary market
                await erc20.approve(htlc20.address, tokens(1000), {from: investor1})  // investor approves the htlc contract to move the tokens from his wallet to fund the order
                await htlc20.fundOrder(orderID, {from: investor1})
                withdrawal = await htlc20.issuerWithdrawal(orderID, secretBytes32, {from:issuer})
                checkOrder = await htlc20.checkOrder(orderID)

            })
            

            describe("successful withdrawal", ()=>{

                it("transfers the payment token to the issuer", async()=>{
                    const issuerBalance = await erc20.balanceOf(issuer)
                    const htlcBalance = await erc20.balanceOf(htlc20.address)
                    htlcBalance.toString().should.be.equal("0", "htlc released the token")
                })

                it("emits the closed order event after successful withdrawal by the issuer of the security token", async()=>{
                    withdrawal.logs[0].event.should.be.equal("ClosedOrder", "issuer withdraws and closes the order")
                })

                it("made the secret visible to the investor, hence the investor can withdraw the security token with the secret", ()=>{
                    secret_phrase.should.be.equal(web3.utils.hexToUtf8(checkOrder._secretKey), "it reveals the correct secret to the investor")   
                })

                it("should have a closed order state", ()=>{
                    checkOrder._orderState.toString().should.be.equal(swapState.CLOSED, "the order is closed after withdrawal by the issuer")
                })

               

            })

        })

    })

    /*describe("refund expired order", ()=>{

        let orderID2 = web3.utils.asciiToHex("x23d33sdgdp")
        const expired = new Date(moment().subtract(2, 'days').unix()).getTime()       // set expiration to 2 days before
        let refund

        beforeEach(async()=>{

            await htlc20.openOrder(orderID2, investor1, price, amount, expired, secretHash, secretBytes32, classA)
            await erc20.transfer(investor1, tokens(2000))                           // investor purchases usdt token from escrow/exchanges/p2p/any secondary market
            await erc20.approve(htlc20.address, tokens(1000), {from: investor1})    // investor approves the htlc contract to move the tokens from his wallet to fund the order
            funded = await htlc20.fundOrder(orderID2, {from: investor1})            // investor funds the order
        })

        describe("the order is opened", ()=>{

            it("check the order to be opened", async()=>{
                const checkOrder = await htlc20.checkOrder(orderID2)
                checkOrder._orderState.toString().should.be.equal(swapState.OPEN, "the order is opened")
            })

        })

        describe("withdrawal fails for expired order", ()=>{

            it("should revert if the issuer tries to withdraw an opened order that is expired", async()=>{
                await htlc20.issuerWithdrawal(orderID2, secretBytes32, {from: issuer}).should.be.rejected
            })

        })

        describe("refund", ()=>{

            let checkOrder

            beforeEach(async()=>{
                refund = await htlc20.refund(orderID2, {from: investor1})
                checkOrder = await htlc20.checkOrder(orderID2)

            })

            it("should have an expired order state after refund", ()=>{
                checkOrder._orderState.toString().should.be.equal(swapState.EXPIRED, "the order state changes to EXPIRED after refund")
            })

            it("refunds the investor's payment to the investor's wallet", async()=>{

                const balance = await erc20.balanceOf(investor1)
                balance.toString().should.be.equal(tokens(2000).toString(), "it refunds the deposited token to the investor's wallet")
                refund.logs[0].event.should.be.equal("RefundedOrder", "it emits the refund event")


            })


            it("should fail for every attempted withdrawal from issuer on any refunded order", async()=>{

                await htlc20.issuerWithdrawal(orderID2, secretBytes32, {from: issuer}).should.be.rejected

            })

            

            

        })

    })*/

})