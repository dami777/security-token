require("chai")
    .use(require("chai-as-promised"))
    .should()


const { ETHER_ADDRESS, tokens, swapState, expire, expired, stringToHex, hashSecret, setToken, reverts} = require("./helper.js")

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


    let classA = stringToHex("CLASS A")
    let classB = stringToHex("CLASS B")

    
    
    
    let tanglTokenDetails = setToken("TANGL", "TAN", 18, 0, [classA.hex,classB.hex])
    let reitTokenDetails = setToken("Real Estate Investment Trust", "REIT", 18, 0, [classA.hex,classB.hex])


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

        it("should revert if a call is made to any non existing function", async()=>{
            await htlcEth.sendTransaction({value: 1, from: tanglAdministrator, reitAdministrator} "order",1 ()=>{

        let secret_phrase = "anonymous"
        let secretBytes32 = web3.utils.asciiToHex(secret_phrase)
        let dataHex1 = web3.eth.abi.encodeParameter("bytes32", secretBytes32)
        let secretHash = ethers.utils.sha256(dataHex1)
        let orderID = web3.utils.asciiToHex("x23dvsdgd")
        let orderID2 = web3.utils.asciiToHex("x23dvsdgdu")
        let expiration = new Date(moment().add(1, 'days').unix()).getTime()     // expiration will be present time + 1 day
        let classA = web3.utils.asciiToHex("CLASS A")
        let price = ether(0.2)                                                // price of the asset
        let amount = tokens(10)
        let order
        let order2
        
        
        beforeEach(async()=>{
            order = await htlcEth.openOrder(orderID, investor, price, amount, expiration, secretHash, secretBytes32, classA)
            order2 = await htlcEth.openOrder(orderID2, investor, price, amount, expiration, secretHash, secretBytes32, classA)
        })

        describe("opening order", ()=>{

            describe("successful opened order", ()=>{

                it("emits the open order event", ()=>{
                    order.logs[0].event.should.be.equal("OpenedOrder", "it emits the OpenedOrder event")
                })

            })

            describe("failed opened order", ()=>{

                it("fails to reopen an opened order", async()=>{

                    await htlcEth.openOrder(orderID, investor, price, amount, expiration, secretHash, secretBytes32, classA).should.be.rejected
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

            describe("check order", ()=>{

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
            })

            describe("failed funding", ()=>{
                
                it("should fail to fund if attempted again by the investor", async()=>{
                    await htlcEth.fundOrder(orderID, {from: investor, value: price}).should.be.rejected
                })

                it("should fail to fund if attempted by the wrong investor", async()=>{
                    
                    await htlcEth.fundOrder(orderID2, {from: investor2, value: price}).should.be.rejected
                })


            })

            describe("tanglAdministrator, reitAdministrator          1    let checkOrder
                let tanglAdministrator, reitAdministratorE      bef1oreEach(async()=>{
                    tanglAdministrator, reitAdministratorE anglAdmi1nistrator, reitAdministrator) ministra1tor, reitAdministratorW tor, rei1tAdministrator} rder(ord1erID)
                })

                describe("successful withdrawal", ()=>{

                    it("closes the order", ()=>{
                        withdrawal.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event")
                        checkOrder._orderState.toString().should.be.equal(swapState.CLOSED, "the order state is updated to closed")
                    })
    
                    it("releases the ether to the tanglAdministrator, reitAdministrator" ce = awa1it web3.eth.getBalance(htlcEth.address)
                        const tanglAdministrator, reitAdministratorE nglAdmin1istrator, reitAdministrator) .should.1be.equal("0", "ether was withdrawn from the contract")
                        tanglAdministrator, reitAdministratorB stratorE1 nistrato1r, reitAdministratorE        t1anglAdministrator, reitAdministratorB or, reit1Administrator'         1            })

                })

                describe("failed withdrawal", ()=>{

                    it("fails to withdraw if the order has been closed", async()=>{
                        await htlcEth.tanglAdministrator, reitAdministratorW tor, rei1tAdministrator}         1  it("fails to release payment if withdrawal is attempted by the wrong recipient", async()=>{
                        await htlcEth.tanglAdministrator, reitAdministratorW ld.be.re1jected
                    })

                    it("fails to withdraw from an order that has not been funded by the investor", async()=>{
                        await htlcEth.tanglAdministrator, reitAdministratorW ator, re1itAdministrator}         1  it("should fail if withrawal is attempted with the wrong secret", async()=>{

                        const wrongSecret = web3.utils.asciiToHex("ava")
                        await htlcEth.fundOrder(orderID2, {from: investor, value: price})
                        await htlcEth.tanglAdministrator, reitAdministratorW or, reit1Administrator}       })1

                describe("failed activities on withdrawn orders", ()=>{

                    it("fails to open a closed order", async()=>{
                        await htlcEth.openOrder(orderID, investor, price, amount, expiration, secretHash, secretBytes32, classA).should.be.rejected
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

                        secret_phrase.should.be.equal(web3.utils.hexToUtf8(checkOrder._secretKey), "tanglAdministrator, reitAdministrator          1  })

                })

            })

            describe("reentrancy attack", ()=>{

                /// this commented test case is only valid is reEntrancy defence is removed from the withdraw function

                /*let reEntrancyAttack

                beforeEach(async()=>{
                    reEntrancyAttack = await withdrawReEntrancy.attack(orderID, secretBytes32)
                })

                describe("successful attack", ()=>{

                    it("updates the balance of the contract after carrying out the attack", async()=>{
                    
                        const attackContractBalance = await web3.eth.getBalance(reEntrancy.address)
                        const attackContractBalanceIncreased = Number(attackContractBalance.toString()) > 0
                        attackContractBalanceIncreased.should.be.equal(true, "the contract balance was incremented")
                        
                    })
                })*/

                describe("failed attack", ()=>{

                    beforeEach(async()=>{
                        await htlcEth.fundOrder(orderID2, {from: investor, value: price})
                    })

                    it("fails to execute re-entrancy attack", async()=>{
                        await withdrawReEntrancy.attack(orderID, secretBytes32).should.be.rejected
                        const balanceAfterFailedAttack = await withdrawReEntrancy.balance()
                        balanceAfterFailedAttack.toString().should.be.equal("0", "could not withdraw any ether")
                    })
                })

            })

        })

        describe("refunding expired order", ()=>{

            let orderID3 = web3.utils.asciiToHex("x23d33sdgdp")
            let orderID4 = web3.utils.asciiToHex("x23d33sdgdb")
            let expired = new Date(moment().subtract(2, 'days').unix()).getTime()       // set expiration to 2 days before
            let refund
            let balanceBeforeRefund
            let balanceAfterRefund

            beforeEach(async()=>{

                await htlcEth.openOrder(orderID3, investor, price, amount, expired, secretHash, secretBytes32, classA)
                await htlcEth.openOrder(orderID4, investor, price, amount, expired, secretHash, secretBytes32, classA)
               

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

                describe("reEntrancy during refund", ()=>{

                    ////    this commented test is valid if reEntrancy defense is removed from the refund function

                    /*it("should withdraw all the deposited ether into the investor's wallet", async()=>{
                        await refundReEntrancy.attack(orderID3, secretBytes32)
                        const investorBalanceAfterAttack = await web3.eth.getBalance(investor)
                        const htlcBalanceAfterAttack = await web3.eth.getBalance(htlcEth.address)

                        //investorBalanceAfterAttack.toString().should.be.equal((price * 2).toString(), "it returns the balance of the htlc contract")
                        htlcBalanceAfterAttack.toString().should.be.equal("0", "investor withdrew all the ether from the htlc via reEntrancy")
                    })*/

                    it("should fail to attack after implementing defence in the contract", async()=>{

                        const htlcBalanceBeforeFailedAttack = await web3.eth.getBalance(htlcEth.address)              //  balance of the htlc contract before the attempted attack
                        await refundReEntrancy.attack(orderID3, secretBytes32).should.be.rejected                     //  launch the attack; attack fails
                        const htlcBalanceAfterFailedAttack = await web3.eth.getBalance(htlcEth.address)               //  balance after the failed attack
                        htlcBalanceAfterFailedAttack.toString().should.be.equal(htlcBalanceBeforeFailedAttack.toString(), "the ether in the htlc contract remain intact before and after the failed attack")
                        
                    })

                })

            })


            

        })

        
    })



})


//  [*]  update the events with the tanglAdministrator, reitAdministrator' der retu1rn statement with the security token address and tanglAdministrator, reitAdministrator' ng entit1ies
//  []  test fund order
//  []  test withdrawal
//  []  test refund
//  []  disable opening and funding expired orders