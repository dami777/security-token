require("chai")
    .use(require("chai-as-promised"))
    .should()

const moment = require("moment");

const { ETHER_ADDRESS, tokens, ether, 
        swapState, expire, expired, stringToHex, 
        hashSecret, setToken, reverts, wait,
        toBN
} = require("./helper.js")

const HTLC_ETH = artifacts.require("./HTLC_ETH")
const ERC1400 = artifacts.require("./ERC1400")
const RefundReEntrancy = artifacts.require("./RefundReEntrancy")
const WithDrawReEntrancy = artifacts.require("./WithDrawReEntrancy")


contract ("HTLC for ETH Deposit", ([tanglAdministrator, reitAdministrator, investor_Dami, investor_Jeff])=>{

    let htlcEth
    let refundReEntrancy
    let withdrawReEntrancy
    let tanglSecurityToken
    let reitSecurityToken


    let classA = stringToHex("CLASS A").hex
    let classB = stringToHex("CLASS B").hex

        
    
    let tanglTokenDetails = setToken("TANGL", "TAN", 18, 0, [classA,classB])
    let reitTokenDetails = setToken("Real Estate Investment Trust", "REIT", 18, 0, [classA,classB])

    let gasPrice


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
        
        //  set the gas price

        gasPrice = await web3.eth.getGasPrice()

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
           

            tanglOrder = await htlcEth.openOrder(orderID_1, investor_Dami, tanglSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: tanglAdministrator})
            reitOrder = await htlcEth.openOrder(orderID_1, investor_Jeff, reitSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: reitAdministrator})
            
        })

        /*describe("opening order", ()=>{

            

            describe("successful opened order", ()=>{

                describe("tangl opened order", ()=>{


                    it("emits the open order event for tangl opened order and the data associated with it", ()=>{
                    
                        tanglOrder.logs[0].event.should.be.equal("OpenedOrder", "it emits the OpenedOrder event")
                        tanglOrder.logs[0].args._investor.should.be.equal(investor_Dami, "it emits the investor's address associated with the order")
                        tanglOrder.logs[0].args._issuer.should.be.equal(tanglAdministrator, "it emits the administraot/issuer's address associated with the order")
                        tanglOrder.logs[0].args._securityToken.should.be.equal(tanglSecurityToken.address, "it emits the security address associated with the order")
                        web3.utils.hexToUtf8(tanglOrder.logs[0].args._partition).should.be.equal("CLASS A", "it emits the partition/share class associated with the order")
                        tanglOrder.logs[0].args._amount.toString().should.be.equal(amount.toString(), "it emits the amount of token associated with the order")
                        tanglOrder.logs[0].args._price.toString().should.be.equal(price.toString(), "it emits the price of token in ether associated with the order")
                        web3.utils.hexToUtf8(tanglOrder.logs[0].args._swapID).should.be.equal("1", "it emits the order id associated with the order")
                        tanglOrder.logs[0].args._secretHash.should.be.equal(secretHash, "it emits the secret hash of the order")
                    
                    })
    

                    it("verifies data of the order", async()=>{

                        const orderID_1 = stringToHex("1").hex

                        const checkTanglOrder = await htlcEth.checkOrder(orderID_1, tanglSecurityToken.address)

                        checkTanglOrder._issuer.should.be.equal(tanglAdministrator, "it returned the administrator associated with the order")
                        checkTanglOrder._investor.should.be.equal(investor_Dami, "it returned the investor asscociated with the order")
                        checkTanglOrder._securityTokenAddress.should.be.equal(tanglSecurityToken.address, "it returned the security token associated with the order")
                        checkTanglOrder._price.toString().should.be.equal(price.toString(), "it returned the price of the token in ether associated with the order")
                        checkTanglOrder._expiration.toString().should.be.equal(expiration.toString(), "it returned the expiration period associated with the order")
                        checkTanglOrder._funded.should.be.equal(false, "it returns false as the fund status of the order")
                        web3.utils.hexToUtf8(checkTanglOrder._orderID).should.be.equal("1", "it reurns the order id")
                        checkTanglOrder._orderState.toString().should.be.equal(swapState.OPEN, "it returns the order state as OPEN")
                        web3.utils.hexToUtf8(checkTanglOrder._secretKey).should.be.equal("", "it returns 0 as the current secret key because the secret is yet to be revealed by the issuer")

                    })

                })


                describe("reit opened order", ()=>{

                    it("emits the open order event for reit opened order and the data associated with it", ()=>{
                    
                        reitOrder.logs[0].event.should.be.equal("OpenedOrder", "it emits the OpenedOrder event")
                        reitOrder.logs[0].args._investor.should.be.equal(investor_Jeff, "it emits the investor's address associated with the order")
                        reitOrder.logs[0].args._issuer.should.be.equal(reitAdministrator, "it emits the administraot/issuer's address associated with the order")
                        reitOrder.logs[0].args._securityToken.should.be.equal(reitSecurityToken.address, "it emits the security address associated with the order")
                        web3.utils.hexToUtf8(reitOrder.logs[0].args._partition).should.be.equal("CLASS A", "it emits the partition/share class associated with the order")
                        reitOrder.logs[0].args._amount.toString().should.be.equal(amount.toString(), "it emits the amount of token associated with the order")
                        reitOrder.logs[0].args._price.toString().should.be.equal(price.toString(), "it emits the price of token in ether associated with the order")
                        web3.utils.hexToUtf8(reitOrder.logs[0].args._swapID).should.be.equal("1", "it emits the order id associated with the order")
                        reitOrder.logs[0].args._secretHash.should.be.equal(secretHash, "it emits the secret hash of the order")
                    
                    })


                    it("verifies data of the order", async()=>{

                        const orderID_1 = stringToHex("1").hex

                        const checkReitOrder = await htlcEth.checkOrder(orderID_1, reitSecurityToken.address)

                        checkReitOrder._issuer.should.be.equal(reitAdministrator, "it returned the administrator associated with the order")
                        checkReitOrder._investor.should.be.equal(investor_Jeff, "it returned the investor asscociated with the order")
                        checkReitOrder._securityTokenAddress.should.be.equal(reitSecurityToken.address, "it returned the security token associated with the order")
                        checkReitOrder._price.toString().should.be.equal(price.toString(), "it returned the price of the token in ether associated with the order")
                        checkReitOrder._expiration.toString().should.be.equal(expiration.toString(), "it returned the expiration period associated with the order")
                        checkReitOrder._funded.should.be.equal(false, "it returns false as the fund status of the order")
                        web3.utils.hexToUtf8(checkReitOrder._orderID).should.be.equal("1", "it reurns the order id")
                        checkReitOrder._orderState.toString().should.be.equal(swapState.OPEN, "it returns the order state as OPEN")
                        web3.utils.hexToUtf8(checkReitOrder._secretKey).should.be.equal("", "it returns 0 as the current secret key because the secret is yet to be revealed by the issuer")

                    })


                })


            })

            describe("failed opened order", ()=>{

                const orderID_1 = stringToHex("1").hex
                const orderID_2 = stringToHex("2").hex

                it("fails to reopen an opened order", async()=>{

                    

                    await htlcEth.openOrder(orderID_1, investor_Jeff, tanglSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: tanglAdministrator}).should.be.rejectedWith(reverts.EXISTING_ID)
                    await htlcEth.openOrder(orderID_1, investor_Dami, reitSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: reitAdministrator}).should.be.rejectedWith(reverts.EXISTING_ID)
                    
                    
                
                })

                it("fails to open that order with an invalid secret", async()=>{
                    await htlcEth.openOrder(orderID_2, investor_Dami, reitSecurityToken.address, price, amount, expiration, hashSecret("invalid").secretHash, secretHex, classA, {from: reitAdministrator}).should.be.rejectedWith(reverts.INVALID_SECRET)
                })

                it("fails to open order if the expired order is lesser than the opening time", async()=>{
                    await htlcEth.openOrder(orderID_2, investor_Dami, reitSecurityToken.address, price, amount, expired(1), secretHash, secretHex, classA, {from: reitAdministrator}).should.be.rejectedWith(reverts.EXPIRATION_TIME_LESS_THAN_NOW)
                })
            })

            
    
        })*/

        /*describe("funding order", ()=>{

            let fundTanglOrder
            let fundReitOrder
            const orderID_1 = stringToHex("1").hex
            let contractEtherBalanceBeforeFunding


            beforeEach(async()=>{

                contractEtherBalanceBeforeFunding = await web3.eth.getBalance(htlcEth.address)

                fundTanglOrder = await htlcEth.fundOrder(orderID_1, tanglSecurityToken.address, {from: investor_Dami, value: price})
                fundReitOrder = await htlcEth.fundOrder(orderID_1, reitSecurityToken.address, {from: investor_Jeff, value: price})
            
            })

            describe("contract ether balance", ()=>{

                it("should increase the ether balance of the contract", async()=>{
                    
                    const contractEtherBalanceAfterFunding = await web3.eth.getBalance(htlcEth.address)
                    
                    Number(contractEtherBalanceAfterFunding - contractEtherBalanceBeforeFunding).should.been.equal(Number(price) * 2, "ether was deposited to the contract by the investor associated with the order")
     
                })

            })

            describe("check order", ()=>{

                let checkOrderAfterFunding

                const orderID_1 = stringToHex("1").hex 

                beforeEach(async()=>{
                    checkOrderAfterFunding = await htlcEth.checkOrder(orderID_1, tanglSecurityToken.address)
                })

                it("should be funded", ()=>{

                    checkOrderAfterFunding._funded.should.be.equal(true, "the order has been funded")
                
                })

                it("shouldn't have the secret yet", ()=>{

                    web3.utils.hexToUtf8(checkOrderAfterFunding._secretKey).should.be.equal("", "secret hasn't been revealed yet") 
                
                })
            })

            describe("failed funding", ()=>{

                const orderID_1 = stringToHex("1").hex
                
                it("should fail to fund if attempted again by the investor", async()=>{
                    await htlcEth.fundOrder(orderID_1, tanglSecurityToken.address, {from: investor_Dami, value: price}).should.be.rejectedWith(reverts.FUNDED)
                })

                it("should fail to fund if attempted by the wrong investor", async()=>{

                    const orderID_2 = stringToHex("2").hex

                    await htlcEth.openOrder(orderID_2, investor_Jeff, reitSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: reitAdministrator})

                    
                    await htlcEth.fundOrder(orderID_2, reitSecurityToken.address, {from: investor_Dami, value: price}).should.be.rejectedWith(reverts.INVALID_CALLER)
                })

                it("should fail to fund an expired order", async()=>{

                    /**
                     * Open an order to expire in 10 seconds
                     * wait for 13 seconds. After which the order should have expired
                     * Attempt funding after expiration
                     */

                    /*const expiration = new Date(moment().add(10, 'seconds').unix()).getTime()
                    const orderID_2 = stringToHex("2").hex

                    await htlcEth.openOrder(orderID_2, investor_Jeff, reitSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: reitAdministrator})

                    await wait(13)

                    await htlcEth.fundOrder(orderID_2, reitSecurityToken.address, {from: investor_Jeff, value: price}).should.be.rejectedWith(reverts.EXPIRED)


                })

                it("should fail to fund an unopened order", async()=>{*/

                    /**
                     * This particular order ID isn't a valid opened id 
                     * Funding an unopened id should be reverted
                     */

                    /*const unOpened_ID = stringToHex("4").hex

                    await htlcEth.fundOrder(unOpened_ID, reitSecurityToken.address, {from: investor_Jeff, value: price}).should.be.rejectedWith(reverts.NOT_OPENED)

                })

                it("should fail if the amount to be deposited to the order doesn't match the set price of the order", async()=>{*/

                    /**
                     * The set price for this order is 0.2 ether as defined in the `price` global variable
                     * Funding fails if the amount sent by the investor is not the set price in the order
                     */

                    
                    /*const orderID_3 = stringToHex("3").hex

                    await htlcEth.openOrder(orderID_3, investor_Jeff, reitSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: reitAdministrator})

                    await htlcEth.fundOrder(orderID_3, reitSecurityToken.address, {from: investor_Jeff, value: ether(0.3)}).should.be.rejectedWith(reverts.INVALID_AMOUNT)


                })


            })

            describe("issuer's / administrator's withdrawal", ()=>{

                let tanglAdministratorWithdrawal
                let reitAdministratorWithdrawal

                let reitAdministratorEthBalanceBeforeWithDrawal
                let tanglAdministratorEthBalanceBeforeWithDrawal

                let checkTanglOrder
                let checkReitOrder

                const orderID_1 = stringToHex("1").hex
                

                beforeEach(async()=>{*/

                    /**
                     * get the ether balances of the two adminstrators / issuers before initiating withdrawal
                     * Withdrawal initiated by the two administrators
                     */

                   /* reitAdministratorEthBalanceBeforeWithDrawal = await web3.eth.getBalance(reitAdministrator)
                    tanglAdministratorEthBalanceBeforeWithDrawal = await web3.eth.getBalance(tanglAdministrator)
                    
                    reitAdministratorWithdrawal = await htlcEth.issuerWithdrawal(orderID_1, secretHex, reitSecurityToken.address, {from:reitAdministrator})
                    tanglAdministratorWithdrawal = await htlcEth.issuerWithdrawal(orderID_1, secretHex, tanglSecurityToken.address, {from:tanglAdministrator})
                    
                    checkReitOrder = await htlcEth.checkOrder(orderID_1, reitSecurityToken.address)
                    checkTanglOrder = await htlcEth.checkOrder(orderID_1, tanglSecurityToken.address)

                    
                })

                describe("successful withdrawal", ()=>{

                    it("closes the order", ()=>{

                        tanglAdministratorWithdrawal.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event")
                        reitAdministratorWithdrawal.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event")
                        
                        checkTanglOrder._orderState.toString().should.be.equal(swapState.CLOSED, "the order state is updated to closed")
                        checkReitOrder._orderState.toString().should.be.equal(swapState.CLOSED, "the order state is updated to closed")
                        
                    })
    
                    it("releases the ether to the administrator / issuer", async()=>{*/

                        /**
                         * Get the administrators' balance after withdrawal
                         * Calculate the gas price used by the administrator to initiate the withdrawal
                         * Check that the difference between his balance after and before withdrawal and the added gas price is equal to the amount withdrawn
                         * For accurate calculation, the numbers were converted to Big Integer data type
                         */

                        
                        
                        /*const tanglAdministratorEthBalanceAfterWithdrawal = await web3.eth.getBalance(tanglAdministrator)
                        const reitAdministratorEthBalanceAfterWithdrawal = await web3.eth.getBalance(reitAdministrator)

                        const tanglOrderWithdrawalGasFee = tanglAdministratorWithdrawal.receipt.cumulativeGasUsed * gasPrice;
                        const reitOrderWithdrawalGasFee = reitAdministratorWithdrawal.receipt.cumulativeGasUsed * gasPrice;

                        
                        (BigInt(tanglAdministratorEthBalanceAfterWithdrawal) - BigInt(tanglAdministratorEthBalanceBeforeWithDrawal) + BigInt(tanglOrderWithdrawalGasFee)).toString().should.be.equal(price.toString(), "the administrator withdrew the investor's deposit successfully");
                        (BigInt(reitAdministratorEthBalanceAfterWithdrawal) - BigInt(reitAdministratorEthBalanceBeforeWithDrawal) + BigInt(reitOrderWithdrawalGasFee)).toString().should.be.equal(price.toString(), "the administrator withdrew the investor's deposit successfully");
                        
                        
                    })

                })

                describe("failed withdrawal", ()=>{

                    const orderID_1 = stringToHex("1").hex
                    const orderID_2 = stringToHex("2").hex

                    beforeEach(async()=>{
                            
                        await htlcEth.openOrder(orderID_2, investor_Jeff, reitSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: reitAdministrator})

                    })

                    it("fails to withdraw if the order has been closed", async()=>{
                        await htlcEth.issuerWithdrawal(orderID_1, secretHex, tanglSecurityToken.address, {from:tanglAdministrator}).should.be.rejectedWith(reverts.NOT_OPENED)
                    })

                    it("fails to release payment if withdrawal is attempted by the wrong issuer", async()=>{
                        await htlcEth.issuerWithdrawal(orderID_1, secretHex, reitSecurityToken.address, {from:tanglAdministrator}).should.be.rejectedWith(reverts.INVALID_CALLER)
                    })

                    it("fails to withdraw from an order that has not been funded by the investor", async()=>{

                        await htlcEth.issuerWithdrawal(orderID_2, secretHex, reitSecurityToken.address, {from:reitAdministrator}).should.be.rejectedWith(reverts.NOT_FUNDED)
                    })

                    it("should fail if withrawal is attempted with the wrong secret", async()=>{

                        const wrongSecret = hashSecret("ava").secretHex
                        await htlcEth.fundOrder(orderID_2, reitSecurityToken.address, {from: investor_Jeff, value: price})
                        await htlcEth.issuerWithdrawal(orderID_2, wrongSecret, reitSecurityToken.address, {from:reitAdministrator}).should.be.rejectedWith(reverts.INVALID_SECRET)
                    })

                })

                describe("failed activities on withdrawn orders", ()=>{

                    it("fails to reopen a closed order", async()=>{

                        await htlcEth.openOrder(orderID_1, investor_Jeff, reitSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: reitAdministrator}).should.be.rejectedWith(reverts.EXISTING_ID)
                    
                    })

                    it("fails to fund an order that has been closed", async()=>{

                        await htlcEth.fundOrder(orderID_1, reitSecurityToken.address, {from: investor_Jeff, value: price}).should.be.rejectedWith(reverts.NOT_OPENED)

                    })

                })

                describe("updated order status", ()=>{

                    let checkTanglOrder
                    let checkReitOrder

                    beforeEach(async()=>{

                        checkTanglOrder = await htlcEth.checkOrder(orderID_1, tanglSecurityToken.address)
                        checkReitOrder = await htlcEth.checkOrder(orderID_1, reitSecurityToken.address)

                    })

                    it("should make the secret public", ()=>{

                        secret_phrase.should.be.equal(web3.utils.hexToUtf8(checkTanglOrder._secretKey), "secret was made public after tangl's administrator's withdrawal")   
                        secret_phrase.should.be.equal(web3.utils.hexToUtf8(checkReitOrder._secretKey), "secret was made public after tangl's administrator's withdrawal")   


                    })

                })

            })*/

            describe("reentrancy attack", ()=>{

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

                    const orderID_4 = stringToHex("4").hex

                    beforeEach(async()=>{

                        await htlcEth.openOrder(orderID_4, investor_Dami, tanglSecurityToken.address, ether(0.8), amount, expiration, secretHash, secretHex, classA, {from: tanglAdministrator})

                        await htlcEth.fundOrder(orderID_4, tanglSecurityToken.address, {from: investor_Dami, value: ether(0.8)})

                    })

                    it("fails to execute re-entrancy attack", async()=>{
                        await withdrawReEntrancy.attack(orderID_4, secretHex, tanglSecurityToken.address, {from: tanglAdministrator}).should.be.rejectedWith("Failed to release Ether")
                        const balanceAfterFailedAttack = await withdrawReEntrancy.balance()
                        balanceAfterFailedAttack.toString().should.be.equal("0", "could not withdraw any ether")
                    })
                })*/

            //})

        })

        describe("refunding expired order", ()=>{

            let orderID_3 = stringToHex("3").hex
            let orderID_4 = stringToHex("4").hex
            
            let refund

            let investorJeffbalanceBeforeRefund
            let investorJeffbalanceAfterRefund

            beforeEach(async()=>{


                const expire_10sec = new Date(moment().add(10, 'seconds').unix()).getTime()       // order expires in 10 secs                

                await htlcEth.openOrder(orderID_3, investor_Jeff, reitSecurityToken.address, price, amount, expire_10sec, secretHash, secretHex, classA, {from: reitAdministrator})
                await htlcEth.openOrder(orderID_4, investor_Dami, reitSecurityToken.address, price, amount, expiration, secretHash, secretHex, classA, {from: reitAdministrator})

                
               
                

                
               

            })

            describe("successful refund", ()=>{


                beforeEach(async()=>{

                    /**
                     * Fund order
                     * Wait for 13 secs for the order to expire so that the investor can place a refund order
                     */

                    await htlcEth.fundOrder(orderID_3, reitSecurityToken.address, {from: investor_Jeff, value: price})

                    await wait(13)

                    investorJeffbalanceBeforeRefund = await web3.eth.getBalance(investor_Jeff)

                    refund = await htlcEth.refund(orderID_3, reitSecurityToken.address, {from: investor_Jeff})

                })

                it("should update the order as expired", async()=>{

                    const checkOrder = await htlcEth.checkOrder(orderID_3, reitSecurityToken.address)
                    checkOrder._orderState.toString().should.be.equal(swapState.EXPIRED, "order state is updated to EXPIRED after refund")
                    
                })

                it("should emit the RefundedOrder event", ()=>{
                    refund.logs[0].event.should.be.equal("RefundedOrder", "it emits the refunded order event after refund")
                })

                it("should increment the investor's balance after refund", async()=>{

                    const gasFeeForRefund = refund.receipt.cumulativeGasUsed * gasPrice;
                    const investorJeffbalanceAfterRefund = await web3.eth.getBalance(investor_Jeff)

                    const amountRefunded = BigInt(investorJeffbalanceAfterRefund) - BigInt(investorJeffbalanceBeforeRefund) + BigInt(gasFeeForRefund)

                    amountRefunded.toString().should.be.equal(price.toString(), "the price associated with the order was refunded to the investor")


                })


              

            })

            describe("failed refund", ()=>{

                it("should fail to refund if call is made by the wrong investor", async()=>{
                    await htlcEth.refund(orderID_4, reitSecurityToken.address, {from: investor_Jeff}).should.be.rejectedWith(reverts.INVALID_CALLER)
                })

                it("should fail to refund any unfunded order", async()=>{

                    await htlcEth.refund(orderID_4, reitSecurityToken.address, {from: investor_Dami}).should.be.rejectedWith(reverts.NOT_FUNDED)

                })

                it("should fail to refund any unexpired open order", async()=>{

                    await htlcEth.fundOrder(orderID_4, reitSecurityToken.address, {from: investor_Dami, value: price})
                    await htlcEth.refund(orderID_4, reitSecurityToken.address, {from: investor_Dami}).should.be.rejected

                })

            })

            describe("reEntrancy attack at refund", ()=>{

                // investor funds the orders

                const orderID_5  = stringToHex("5").hex

                beforeEach(async()=>{

                    const expire_10sec = new Date(moment().add(10, 'seconds').unix()).getTime()       // order expires in 10 secs 

                    await htlcEth.openOrder(orderID_5, investor_Dami, reitSecurityToken.address, ether(1), amount, expire_10sec, secretHash, secretHex, classA, {from: reitAdministrator})

                    await htlcEth.fundOrder(orderID_5, reitSecurityToken.address, {from: investor_Dami, value: ether(1)})
                    

                })

                

                describe("reEntrancy during refund", ()=>{


                    it("should fail to attack after implementing defence in the contract", async()=>{

                        await wait(13)
                        
                        const htlcBalanceBeforeFailedAttack = await web3.eth.getBalance(htlcEth.address)              //  balance of the htlc contract before the attempted attack
                        await refundReEntrancy.attack(orderID_5, reitSecurityToken.address).should.be.rejectedWith("Failed to release Ether")                     //  launch the attack; attack fails
                        const htlcBalanceAfterFailedAttack = await web3.eth.getBalance(htlcEth.address)               //  balance after the failed attack
                        htlcBalanceAfterFailedAttack.toString().should.be.equal(htlcBalanceBeforeFailedAttack.toString(), "the ether in the htlc contract remain intact before and after the failed attack")
                        
                    })

                })

            })


            

        })

        
    })


})


//  [*]  update the events with the tanglAdministrator, reitAdministrator's address and token address
//  [*]  update the check order return statement with the security token address and tanglAdministrator, reitAdministrator's address
//  [*]  test open orders with different issuing entities
//  [*]  test fund order
//  []  test withdrawal
//  []  test refund
//  []  disable opening and funding expired orders