require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ethers } = require("ethers")
const { ETHER_ADDRESS, tokens, signer, data, signature, ethHash, wait, swapState} = require("./helper.js")
const moment = require("moment");



//  Security token and it's htlc


const HTLC1400 = artifacts.require("./HTLC1400")
const ERC1400 = artifacts.require("./ERC1400")


//  usdt and it's htlc
const HTLC20 = artifacts.require("./HTLC20")
const ERC20_USDT = artifacts.require("./ERC20")     // this erc20 token will be represented as usdt


contract ("DVP", ([issuer, investor, USDT_MARKET])=>{

    let htlc20 
    let htlc1400

    let erc20
    let erc1400
    

    let name = "Tangl"
    let symbol = "TAN"
    let decimal = 18
    let totalSupply = 0
    let classA = web3.utils.asciiToHex("CLASS A")
    let classB = web3.utils.asciiToHex("CLASS B")



    beforeEach(async()=>{

        erc20 = await ERC20_USDT.new("US Dollars Tether", "USDT", {from: USDT_MARKET})
        htlc20 = await HTLC20.new(erc20.address)

        erc1400 = await ERC1400.new(name, symbol, decimal, totalSupply, [classA, classB] )
        htlc1400 = await HTLC1400.new(erc1400.address)

        await erc1400.setController(signer)
    })

    describe("Issuer opens orders on the two htlc contracts", ()=>{

        let orderID = web3.utils.asciiToHex("x23dvsdgd")
        let openOrderHtlc20
        let openOrderHtlc1400

        let expirationHTLC20 = new Date(moment().add(1, 'days').unix()).getTime()    // expiration will be present time + 1 day
        let expirationHTLC1400 = new Date(moment().add(2, 'days').unix()).getTime()    // expiration will be present time + 2 day

        let secret = web3.utils.asciiToHex("anonymous")
        let dataHex = web3.eth.abi.encodeParameter("bytes32", secret)
        let secretHash = ethers.utils.sha256(dataHex)

        beforeEach(async()=>{

            // issuer mints tokens to his wallet
            await erc1400.issueByPartition(classA, issuer, 100, data)

            //  issuer approves htlc1400 to move the tokens and fund the order
            await erc1400.authorizeOperator(htlc1400.address, {from: issuer})       //set the htlc contract to be an operator

            openOrderHtlc20 = await htlc20.openOrder(orderID, investor, tokens(1000), expirationHTLC20, secretHash, secret, {from: issuer})
            openOrderHtlc1400 = await htlc1400.openOrder(orderID, secret, secretHash, classA, investor, tokens(5), expirationHTLC1400, data, {from: issuer})
        })

        describe("success", ()=>{

            it("emits the open order event for both ordres", ()=>{
                openOrderHtlc20.logs[0].event.should.be.equal("OpenedOrder", "issuer opens order on the htlc 20 contract")
                openOrderHtlc1400.logs[0].event.should.be.equal("OpenedOrder", "issuer opens order on the htlc 1400 contract")
            })
            
        })

        describe("fill order", async()=>{

            beforeEach(async()=>{

                //  investor purchases USDT from p2p/escrow, exchanges
                await erc20.transfer(investor, tokens(2000), {from: USDT_MARKET})           // investor purchases usdt token from escrow/exchanges/p2p/any secondary market

                // investor approves the htlc20 contract to move tokens from his wallet to fund the order
                await erc20.approve(htlc20.address, tokens(1000), {from: investor})  // investor approves the htlc contract to move the tokens from his wallet to fund the order

                //  investor funds the order
                await htlc20.fundOrder(orderID, {from: investor})
            })


            describe("Token swap", ()=>{

                let issuerWithdraws
                let investorWithdraws

                beforeEach(async()=>{

                    issuerWithdraws = await htlc20.issuerWithdrawal(orderID, secret)            // issuer withdraws the payment token and reveals the secret
                })


                describe("issuer's withdrawal", async()=>{

                    it("emits the closed order after issuer withdraws the payment", async()=>{

                        issuerWithdraws.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event as the issuer withdraws the payment")
                    })

                })

                describe("investor's withdrawal after getting to know the secret", ()=>{

                    let checkOrder
                    let revealedSecret
                
                    
                    beforeEach(async()=>{

                        checkOrder = await htlc20.checkOrder(orderID)
                        revealedSecret = checkOrder._secretKey                                                              // reveals the secret to the investor
                        investorWithdraws = await htlc1400.recipientWithdrawal(orderID, revealedSecret, {from: investor})   // investor proceeds with withdrawing the security token after getting to know the secret
                    })

                    it("emits the closed order event ", ()=>{

                        investorWithdraws.logs[0].event.should.be.equal("ClosedOrder", "emitted the closed order event")                        

                    })

    
                    it("updates the balance of the issuer and the investor", async()=>{

                        const issuerPaymentBalance = await erc20.balanceOf(issuer)
                        const investorSecurityTokenBalance = await erc1400.balanceOfByPartition(classA, investor)

                        issuerPaymentBalance.toString().should.be.equal(tokens(1000).toString(), "payment token was released to the issuer")
                        investorSecurityTokenBalance.toString().should.be.equal(tokens(5).toString(), "security token was released to the investor")


                    })

                })

            })

        })

    })

})