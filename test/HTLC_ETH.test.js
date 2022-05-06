require("chai")
    .use(require("chai-as-promised"))
    .should()


const { ETHER_ADDRESS, tokens, ether, swapState, expire, expired, stringToHex, hashSecret, setToken, reverts} = require("./helper.js")

const HTLC_ETH = artifacts.require("./HTLC_ETH")
const ERC1400 = artifacts.require("./ERC1400")
const RefundReEntrancy = artifacts.require("./RefundReEntrancy")
const WithDrawReEntrancy = artifacts.require("./WithDrawReEntrancy")


contract ("HTLC for ETH Deposit", ([tanglAdministrator, reitAdministrator, investor1, investor2])=>{

    let htlcEth
    let refundReEntrancy
    let withdrawReEntrancy
    let tanglSecurityToken
    let reitSecurityToken


    let classA = stringToHex("CLASS A").hex
    let classB = stringToHex("CLASS B").hex

    
    
    
    let tanglTokenDetails = setToken("TANGL", "TAN", 18, 0, [classA,classB])
    let reitTokenDetails = setToken("Real Estate Investment Trust", "REIT", 18, 0, [classA,classB])


    beforeEach(async()=>{

        /**
         * deploy the htlc contract for eth
         * deploy the contract to attempt refund re-entrancy attack
         * deploy the contract to attempt withdrawal re-entrancy attack
         * deploy the contract for tangl security token
         * deploy the contract for real estate investment trust security token
         */

        htlcEth = await HTLC_ETH.new()
        refundReEntrancy = await RefundReEntrancy.new(htlcEth.address)
        withdrawReEntrancy = await WithDrawReEntrancy.new(htlcEth.address)
        tanglSecurityToken = await ERC1400.new(tanglTokenDetails.name, tanglTokenDetails.symbol, tanglTokenDetails.decimal, tanglTokenDetails.totalSupply, tanglTokenDetails.shareClass, {from: tanglAdministrator})
        reitSecurityToken = await ERC1400.new(reitTokenDetails.name, reitTokenDetails.symbol, reitTokenDetails.decimal, reitTokenDetails.totalSupply, reitTokenDetails.shareClass, {from: reitAdministrator})
        

    })

    describe("contract address", ()=>{

        it("should have a contract address", ()=>{
            htlcEth.address.should.not.be.equal("", "it has a contract address")
            refundReEntrancy.address.should.not.be.equal("", "it has a contract address")
            withdrawReEntrancy.address.should.not.be.equal("", "it has a contract address")
        })

    })


    describe("fallback", ()=>{

        it("should revert if a call is made to any non existing function to transfer ether", async()=>{
            await htlcEth.sendTransaction({value: 1, from: tanglAdministrator, reitAdministrator}).should.be.rejected
        })

    })


    describe("order", ()=>{

        let secret_phrase = "anonymous"
        let secretHex = hashSecret(secret_phrase).secretHex
        let secretHash = hashSecret(secret_phrase).secretHash
        let expiration = expire(1)                      // expiration will be present time + 1 day
        let price = ether(0.2)                                                // price of the asset
        let amount = tokens(10)
        let tanglOrder
        let reitorder
        
        
        beforeEach(async()=>{

            const orderID_1 = stringToHex("1").hex
           

            tanglOrder = await htlcEth.openOrder(orderID_1, investor1, tanglSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: tanglAdministrator})
            reitOrder = await htlcEth.openOrder(orderID_1, investor2, reitSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: reitAdministrator})

        })

        describe("opening order", ()=>{

            describe("successful opened order", ()=>{

                describe("tangl opened order", ()=>{


                    it("emits the open order event for tangl opened order and the data associated with it", ()=>{
                    
                        tanglOrder.logs[0].event.should.be.equal("OpenedOrder", "it emits the OpenedOrder event")
                        tanglOrder.logs[0].args._investor.should.be.equal(investor1, "it emits the investor's address associated with the order")
                        tanglOrder.logs[0].args._issuer.should.be.equal(tanglAdministrator, "it emits the administraot/issuer's address associated with the order")
                        tanglOrder.logs[0].args._securityToken.should.be.equal(tanglSecurityToken.address, "it emits the security address associated with the order")
                        web3.utils.hexToUtf8(tanglOrder.logs[0].args._partition).should.be.equal("CLASS A", "it emits the partition/share class associated with the order")
                        tanglOrder.logs[0].args._amount.toString().should.be.equal(amount.toString(), "it emits the amount of token associated with the order")
                        tanglOrder.logs[0].args._price.toString().should.be.equal(price.toString(), "it emits the price of token in ether associated with the order")
                        web3.utils.hexToUtf8(tanglOrder.logs[0].args._swapID).should.be.equal("1", "it emits the order id associated with the order")
                        tanglOrder.logs[0].args._secretHash.should.be.equal(secretHash, "it emits the secret hash of the order")
                    
                    })
    

                    it("data of the order", async()=>{

                        const checkTanglOrder = await htlcEth.checkOrder(orderID_1, tanglSecurityToken.address)

                        checkTanglOrder._issuer.should.be.equal(tanglAdministrator, "it returned the administrator associated with the order")
                        checkTanglOrder._investor.should.be.equal(investor1, "it returned the investor asscociated with the order")
                        checkTanglOrder._securityTokenAddress.should.be.equal(tanglSecurityToken.address, "it returned the security token associated with the order")
                        checkTanglOrder._amount.toString().should.be.equal(amount.toString(), "it emits the token amount associated with the order")
                        checkTanglOrder._price.toString().should.be.equal(price.toString(), "it returned the price of the token in ether associated with the order")
                        checkTanglOrder._expiration.toString().should.be.equal(expiration.toString(), "it returned the expiration period associated with the order")
                        checkTanglOrder._funded.should.be.equal(false, "it returns false as the fund status of the order")
                        web3.utils.hexToUtf8(checkTanglOrder._swapID).should.be.equal("1", "it reurns the order id")
                        checkTanglOrder._orderState.toString().should.be.equal(swapState.OPEN, "it returns the order state as OPEN")
                        web3.utils.hexToUtf8(checkTanglOrder._secretKey).should.be.equal("0", "it returns 0 as the current secret key because the secret is yet to be revealed by the issuer")
                    })

                })


                describe("reit opened order", ()=>{

                    it("emits the open order event for reit opened order and the data associated with it", ()=>{
                    
                        reitOrder.logs[0].event.should.be.equal("OpenedOrder", "it emits the OpenedOrder event")
                        reitOrder.logs[0].args._investor.should.be.equal(investor2, "it emits the investor's address associated with the order")
                        reitOrder.logs[0].args._issuer.should.be.equal(reitAdministrator, "it emits the administraot/issuer's address associated with the order")
                        reitOrder.logs[0].args._securityToken.should.be.equal(reitSecurityToken.address, "it emits the security address associated with the order")
                        web3.utils.hexToUtf8(reitOrder.logs[0].args._partition).should.be.equal("CLASS A", "it emits the partition/share class associated with the order")
                        reitOrder.logs[0].args._amount.toString().should.be.equal(amount.toString(), "it emits the amount of token associated with the order")
                        reitOrder.logs[0].args._price.toString().should.be.equal(price.toString(), "it emits the price of token in ether associated with the order")
                        web3.utils.hexToUtf8(reitOrder.logs[0].args._swapID).should.be.equal("1", "it emits the order id associated with the order")
                        reitOrder.logs[0].args._secretHash.should.be.equal(secretHash, "it emits the secret hash of the order")
                    
                    })

                })


            })

            describe("failed opened order", ()=>{

                it("fails to reopen an opened order", async()=>{

                    const orderID_1 = stringToHex("1").hex

                    await htlcEth.openOrder(orderID_1, investor2, tanglSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: tanglAdministrator}).should.be.rejectedWith(reverts.EXISTING_ID)
                    await htlcEth.openOrder(orderID_1, investor1, reitSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: reitAdministrator}).should.be.rejectedWith(reverts.EXISTING_ID)
                
                })
            })

            
    
        })

        describe("funding order", ()=>{

            let fund 

            beforeEach(async()=>{
                fund = await htlcEth.fundOrder(orderID, {from: investor, value: price})
            })

            describe("contract ether balance", ()=>{

                it("should increase the ether balance of the contract", async()=>{
                    
                    const ethBalance = await web3.eth.getBalance(htlcEth.address)
                    ethBalance.toString().should.be.equal(price.toString(), "ether was successfully deposited")
     
                })

            })

            /*describe("check order", ()=>{

                let checkOrder

                beforeEach(async()=>{
                    checkOrder = await htlcEth.checkOrder(orderID)
                })

                it("should be funded", ()=>{
                    checkOrder._funded.should.be.equal(true, "the order has been funded")
                })

                it("shouldn't have the secret yet", ()=>{
                    web3.utils.hexToUtf8(checkOrder._secretKey).should.not.be.equal(secretHash, "secret hasn't been revealed yet") 
                })
            })*/

            /*describe("failed funding", ()=>{
                
                it("should fail to fund if attempted again by the investor", async()=>{
                    await htlcEth.fundOrder(orderID, {from: investor, value: price}).should.be.rejected
                })

                it("should fail to fund if attempted by the wrong investor", async()=>{
                    
                    await htlcEth.fundOrder(orderID2, {from: investor2, value: price}).should.be.rejected
                })


            })*/

            /*describe("tanglAdministrator, reitAdministrator withdrawal", ()=>{

                let withdrawal
                let checkOrder
                let tanglAdministrator, reitAdministratorEthBalanceBeforeWithDrawal
                

                beforeEach(async()=>{
                    tanglAdministrator, reitAdministratorEthBalanceBeforeWithDrawal = await web3.eth.getBalance(tanglAdministrator, reitAdministrator)
                    withdrawal = await htlcEth.tanglAdministrator, reitAdministratorWithdrawal(orderID, secretHex, {from:tanglAdministrator, reitAdministrator})
                    checkOrder = await htlcEth.checkOrder(orderID)
                })

                describe("successful withdrawal", ()=>{

                    it("closes the order", ()=>{
                        withdrawal.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event")
                        checkOrder._orderState.toString().should.be.equal(swapState.CLOSED, "the order state is updated to closed")
                    })
    
                    it("releases the ether to the tanglAdministrator, reitAdministrator", async()=>{
                        const htlcEthBalance = await web3.eth.getBalance(htlcEth.address)
                        const tanglAdministrator, reitAdministratorEthBalanceAfterWithdrawal = await web3.eth.getBalance(tanglAdministrator, reitAdministrator)
    
                        htlcEthBalance.toString().should.be.equal("0", "ether was withdrawn from the contract")
                        tanglAdministrator, reitAdministratorBalanceIncreased = Number(tanglAdministrator, reitAdministratorEthBalanceAfterWithdrawal.toString()) > Number(tanglAdministrator, reitAdministratorEthBalanceBeforeWithDrawal.toString())
                        tanglAdministrator, reitAdministratorBalanceIncreased.should.be.equal(true, "tanglAdministrator, reitAdministrator's ether balance increased after withdrawal")
    
    
                    })

                })

                describe("failed withdrawal", ()=>{

                    it("fails to withdraw if the order has been closed", async()=>{
                        await htlcEth.tanglAdministrator, reitAdministratorWithdrawal(orderID, secretHex, {from:tanglAdministrator, reitAdministrator}).should.be.rejected
                    })

                    it("fails to release payment if withdrawal is attempted by the wrong recipient", async()=>{
                        await htlcEth.tanglAdministrator, reitAdministratorWithdrawal(orderID, secretHex, {from:investor}).should.be.rejected
                    })

                    it("fails to withdraw from an order that has not been funded by the investor", async()=>{
                        await htlcEth.tanglAdministrator, reitAdministratorWithdrawal(orderID2, secretHex, {from:tanglAdministrator, reitAdministrator}).should.be.rejected
                    })

                    it("should fail if withrawal is attempted with the wrong secret", async()=>{

                        const wrongSecret = web3.utils.asciiToHex("ava")
                        await htlcEth.fundOrder(orderID2, {from: investor, value: price})
                        await htlcEth.tanglAdministrator, reitAdministratorWithdrawal(orderID2, wrongSecret, {from:tanglAdministrator, reitAdministrator}).should.be.rejected
                    })

                })

                describe("failed activities on withdrawn orders", ()=>{

                    it("fails to open a closed order", async()=>{
                        await htlcEth.openOrder(orderID, investor, price, amount, expiration, secretHash, secretHex, classA).should.be.rejected
                    })

                    it("fails to fund an order that has been closed", async()=>{

                        await htlcEth.fundOrder(orderID, {from: investor, value: price}).should.be.rejected

                    })

                })

                describe("updated order status", ()=>{

                    let checkOrder
                    beforeEach(async()=>{

                        checkOrder = await htlcEth.checkOrder(orderID)

                    })

                    it("should make the secret public", ()=>{

                        secret_phrase.should.be.equal(web3.utils.hexToUtf8(checkOrder._secretKey), "tanglAdministrator, reitAdministrator made the secret public after withdrawl")   

                    })

                })

            })*/

            /*describe("reentrancy attack", ()=>{*/

                /// this commented test case is only valid is reEntrancy defence is removed from the withdraw function

                /*let reEntrancyAttack

                beforeEach(async()=>{
                    reEntrancyAttack = await withdrawReEntrancy.attack(orderID, secretHex)
                })

                describe("successful attack", ()=>{

                    it("updates the balance of the contract after carrying out the attack", async()=>{
                    
                        const attackContractBalance = await web3.eth.getBalance(reEntrancy.address)
                        const attackContractBalanceIncreased = Number(attackContractBalance.toString()) > 0
                        attackContractBalanceIncreased.should.be.equal(true, "the contract balance was incremented")
                        
                    })
                })*/

                /*describe("failed attack", ()=>{

                    beforeEach(async()=>{
                        await htlcEth.fundOrder(orderID2, {from: investor, value: price})
                    })

                    it("fails to execute re-entrancy attack", async()=>{
                        await withdrawReEntrancy.attack(orderID, secretHex).should.be.rejected
                        const balanceAfterFailedAttack = await withdrawReEntrancy.balance()
                        balanceAfterFailedAttack.toString().should.be.equal("0", "could not withdraw any ether")
                    })
                })*/

          /* })*/

        })

        /*describe("refunding expired order", ()=>{

            let orderID3 = web3.utils.asciiToHex("x23d33sdgdp")
            let orderID4 = web3.utils.asciiToHex("x23d33sdgdb")
            let expired = new Date(moment().subtract(2, 'days').unix()).getTime()       // set expiration to 2 days before
            let refund
            let balanceBeforeRefund
            let balanceAfterRefund

            beforeEach(async()=>{

                await htlcEth.openOrder(orderID3, investor, price, amount, expired, secretHash, secretHex, classA)
                await htlcEth.openOrder(orderID4, investor, price, amount, expired, secretHash, secretHex, classA)
               

            })

            describe("successful refund", ()=>{


                beforeEach(async()=>{

                    await htlcEth.fundOrder(orderID3, {from: investor, value: price})
                    balanceBeforeRefund = await web3.eth.getBalance(investor)
                    refund = await htlcEth.refund(orderID3, {from: investor})

                })

                it("should declare the order as expired", async()=>{

                    const checkOrder = await htlcEth.checkOrder(orderID3)
                    checkOrder._orderState.toString().should.be.equal(swapState.EXPIRED, "order state is updated to EXPIRED after refund")
                    
                })

                it("should emit the RefundedOrder event", ()=>{
                    refund.logs[0].event.should.be.equal("RefundedOrder", "it emits the refunded order event after refund")
                })

                it("should increment the investor's balance after refund", async()=>{
                    balanceAfterRefund = await web3.eth.getBalance(investor)
                    incremented = Number(balanceAfterRefund.toString()) > Number(balanceBeforeRefund.toString())
                    incremented.should.be.equal(true, "deposited ether by investor was released to investor")
                })


              

            })

            describe("failed refund", ()=>{

                it("should fail to refund any unfunded order", async()=>{

                    await htlcEth.refund(orderID3).should.be.rejected

                })

                it("should fail to refund any unexpired open order", async()=>{

                    await htlcEth.refund(orderID).should.be.rejected

                })
            })

            describe("reEntrancy attack at refund", ()=>{

                // investor funds the orders

                beforeEach(async()=>{
                    await htlcEth.fundOrder(orderID3, {from: investor, value: price})
                    await htlcEth.fundOrder(orderID4, {from: investor, value: price})
                })

                describe("htlc ether balance", ()=>{

                    it("returns the ether balance of the htlc", async()=>{
                        const balance = await web3.eth.getBalance(htlcEth.address)
                        balance.toString().should.be.equal((price * 2).toString(), "it returns the balance of the htlc contract")
                    })

                })

                describe("reEntrancy during refund", ()=>{*/

                    ////    this commented test is valid if reEntrancy defense is removed from the refund function

                    /*it("should withdraw all the deposited ether into the investor's wallet", async()=>{
                        await refundReEntrancy.attack(orderID3, secretHex)
                        const investorBalanceAfterAttack = await web3.eth.getBalance(investor)
                        const htlcBalanceAfterAttack = await web3.eth.getBalance(htlcEth.address)

                        //investorBalanceAfterAttack.toString().should.be.equal((price * 2).toString(), "it returns the balance of the htlc contract")
                        htlcBalanceAfterAttack.toString().should.be.equal("0", "investor withdrew all the ether from the htlc via reEntrancy")
                    })*/

                    /*it("should fail to attack after implementing defence in the contract", async()=>{

                        const htlcBalanceBeforeFailedAttack = await web3.eth.getBalance(htlcEth.address)              //  balance of the htlc contract before the attempted attack
                        await refundReEntrancy.attack(orderID3, secretHex).should.be.rejected                     //  launch the attack; attack fails
                        const htlcBalanceAfterFailedAttack = await web3.eth.getBalance(htlcEth.address)               //  balance after the failed attack
                        htlcBalanceAfterFailedAttack.toString().should.be.equal(htlcBalanceBeforeFailedAttack.toString(), "the ether in the htlc contract remain intact before and after the failed attack")
                        
                    })

                })

            })


            

        })*/

        
    })



})


//  [*]  update the events with the tanglAdministrator, reitAdministrator's address and token address
//  []  update the check order return statement with the security token address and tanglAdministrator, reitAdministrator's address
//  []  test open orders with different issuing entities
//  []  test fund order
//  []  test withdrawal
//  []  test refund
//  []  disable opening and funding expired orders