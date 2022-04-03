require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ethers } = require("ethers");
const { without } = require("lodash");
const moment = require("moment");
const { ETHER_ADDRESS, tokens, swapState,ether} = require("./helper.js")
const HTLC_ETH = artifacts.require("./HTLC_ETH")
const ReEntrancy = artifacts.require("./ReEntrancy")


contract ("HTLC for ETH Deposit", ([issuer, investor, tester])=>{

    let htlcEth


    beforeEach(async()=>{
        htlcEth = await HTLC_ETH.new()
        reEntrancy = await ReEntrancy.new()
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
        let expiration = new Date(moment().add(1, 'days').unix()).getTime()     // expiration will be present time + 1 day
        let classA = web3.utils.asciiToHex("CLASS A")
        let price = ether(0.5)                                                // price of the asset
        let amount = tokens(10)
        let order
        
        
        beforeEach(async()=>{
            order = await htlcEth.openOrder(orderID, investor, price, amount, expiration, secretHash, secretBytes32, classA)
        })

        describe("opening order", ()=>{

            it("emits the open order event", ()=>{
                order.logs[0].event.should.be.equal("OpenedOrder", "it emits the OpenedOrder event")
            })
    
        })

        describe("funding order", ()=>{

            let fund 

            beforeEach(async()=>{
                fund = await htlcEth.fundOrder(orderID, {from: investor, value: price})
            })

            describe("contract ehter balance", ()=>{

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

            describe("issuer withdrawal", ()=>{

                let withdrawal
                let checkOrder
                let issuerEthBalanceBeforeWithDrawal

                beforeEach(async()=>{
                    issuerEthBalanceBeforeWithDrawal = await web3.eth.getBalance(issuer)
                    withdrawal = await htlcEth.issuerWithdrawal(orderID, secretBytes32, {from:issuer})
                    checkOrder = await htlcEth.checkOrder(orderID)
                })

                it("closes the order", ()=>{
                    withdrawal.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event")
                    checkOrder._orderState.toString().should.be.equal(swapState.CLOSED, "the order state is updated to closed")
                })

                it("releases the ether to the issuer", async()=>{
                    const htlcEthBalance = await web3.eth.getBalance(htlcEth.address)
                    const issuerEthBalance = await web3.eth.getBalance(issuer)

                    htlcEthBalance.toString().should.be.equal("0", "ether was withdrawn from the contract")
                    issuerBalanceIncreased = Number(issuerEthBalance.toString()) > Number(issuerEthBalanceBeforeWithDrawal)
                    issuerBalanceIncreased.should.be.equal(true, "issuer's ether balance increased after withdrawal")
                })

            })

        })

        
    })



})