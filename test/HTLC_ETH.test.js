require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ethers } = require("ethers");
const moment = require("moment");
const { ETHER_ADDRESS, tokens, swapState,ether} = require("./helper.js")
const HTLC_ETH = artifacts.require("./HTLC_ETH")
const ReEntrancy = artifacts.require("./ReEntrancy")


contract ("HTLC for ETH Deposit", ([issuer, exhautedAccount1, exhautedAccount2, exhautedAccount3, investor, investor2])=>{

    let htlcEth
    let reEntrancy


    beforeEach(async()=>{
        htlcEth = await HTLC_ETH.new()
        reEntrancy = await ReEntrancy.new(htlcEth.address)
    })

    describe("contract address", ()=>{

        it("should have a contract address", ()=>{
            htlcEth.address.should.not.be.equal("", "it has a contract address")
            reEntrancy.address.should.not.be.equal("", "it has a contract address")
        })

    })


    describe("fallback", ()=>{

        it("should revert if a call is made to any non existing function", async()=>{
            await htlcEth.sendTransaction({value: 1, from: issuer}).should.be.rejected
        })

    })


    describe("order", ()=>{

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

            describe("issuer withdrawal", ()=>{

                let withdrawal
                let checkOrder
                let issuerEthBalanceBeforeWithDrawal
                

                beforeEach(async()=>{
                    issuerEthBalanceBeforeWithDrawal = await web3.eth.getBalance(issuer)
                    withdrawal = await htlcEth.issuerWithdrawal(orderID, secretBytes32, {from:issuer})
                    checkOrder = await htlcEth.checkOrder(orderID)
                })

                describe("successful withdrawal", ()=>{

                    it("closes the order", ()=>{
                        withdrawal.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event")
                        checkOrder._orderState.toString().should.be.equal(swapState.CLOSED, "the order state is updated to closed")
                    })
    
                    it("releases the ether to the issuer", async()=>{
                        const htlcEthBalance = await web3.eth.getBalance(htlcEth.address)
                        const issuerEthBalanceAfterWithdrawal = await web3.eth.getBalance(issuer)
    
                        htlcEthBalance.toString().should.be.equal("0", "ether was withdrawn from the contract")
                        issuerBalanceIncreased = Number(issuerEthBalanceAfterWithdrawal.toString()) > Number(issuerEthBalanceBeforeWithDrawal.toString())
                        issuerBalanceIncreased.should.be.equal(true, "issuer's ether balance increased after withdrawal")
    
    
                    })

                })

                describe("failed withdrawal", ()=>{

                    it("fails to withdraw if the order has been closed", async()=>{
                        await htlcEth.issuerWithdrawal(orderID, secretBytes32, {from:issuer}).should.be.rejected
                    })

                    it("fails to release payment if withdrawal is attempted by the wrong recipient", async()=>{
                        await htlcEth.issuerWithdrawal(orderID, secretBytes32, {from:investor}).should.be.rejected
                    })

                    it("fails to withdraw from an order that has not been funded by the investor", async()=>{
                        await htlcEth.issuerWithdrawal(orderID2, secretBytes32, {from:issuer}).should.be.rejected
                    })

                    it("should fail if withrawal is attempted with the wrong secret", async()=>{

                        const wrongSecret = web3.utils.asciiToHex("ava")
                        await htlcEth.fundOrder(orderID2, {from: investor, value: price})
                        await htlcEth.issuerWithdrawal(orderID2, wrongSecret, {from:issuer}).should.be.rejected
                    })

                })

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

                        secret_phrase.should.be.equal(web3.utils.hexToUtf8(checkOrder._secretKey), "issuer made the secret public after withdrawl")   

                    })

                })

            })

            /*describe("reentrancy attack", ()=>{

                let reEntrancyAttack

                beforeEach(async()=>{
                    reEntrancyAttack = await reEntrancy.attack(orderID, secretBytes32)
                })

                describe("successful attack", ()=>{

                    it("updates the balance of the contract after carrying out the attack", async()=>{
                    
                        const attackContractBalance = await web3.eth.getBalance(reEntrancy.address)
                        const attackContractBalanceIncreased = Number(attackContractBalance.toString()) > 0
                        attackContractBalanceIncreased.should.be.equal(true, "the contract balance was incremented")
                        
                    })
                })

                describe("failed attack", ()=>{

                    it("fails to execute re-entrancy attack", async()=>{
                        await reEntrancy.attack(orderID, secretBytes32).should.be.rejected
                    })
                })

            })*/

        })

        describe("refunding expired order", ()=>{

            let orderID3 = web3.utils.asciiToHex("x23d33sdgdp")
            let expired = new Date(moment().subtract(2, 'days').unix()).getTime()       // set expiration to 2 days before
            let refund

            beforeEach(async()=>{

                await htlcEth.openOrder(orderID3, investor, price, amount, expired, secretHash, secretBytes32, classA)
                await htlcEth.fundOrder(orderID3, {from: investor, value: price})

            })

            describe("successful refund", ()=>{

                beforeEach(async()=>{
                    
                    refund = await htlcEth.refund(orderID3, {from: investor})
                })

                it("should declare the order as expired", ()=>{
                    const checkOrder = await htlcEth.checkOrder(orderID3)
                    checkOrder._orderState.toString().should.be.equal(swapState.EXPIRED, "order state is updated to EXPIRED after refund")
                    
                })

            })

        })

        
    })



})