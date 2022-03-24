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


contract ("DVP", ([issuer, investor])=>{

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

        erc20 = await ERC20_USDT.new("US Dollars Tether", "USDT")
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
        let expirationHTLC11400 = new Date(moment().add(2, 'days').unix()).getTime()    // expiration will be present time + 2 day

        let secret = web3.utils.asciiToHex("anonymous")
        let dataHex = web3.eth.abi.encodeParameter("bytes32", secret1)
        let secretHash = ethers.utils.sha256(dataHex1)

        beforeEach(()=>{

            openOrderHtlc20 = await htlc20.openOrder(orderID, investor1, tokens(1000), expiration, secretHash, secret, {from: issuer})
            openOrderHtlc1400 = await htlc1400.openOrder(orderID, secret1, hash1, classA, investor, tokens(5), expiration, data, {from: issuer})
        })

        describe("success", ()=>{
            openOrderHtlc20.logs[0].event.should.be.equal("OpenOrder", "issuer opens order on the htlc 20 contract")
            openOrderHtlc1400.logs[0].event.should.be.equal("OpenOrder", "issuer opens order on the htlc 1400 contract")
        })

        describe("fill order", async()=>{

            beforeEach(()=>{
                //  investor purchases USDT from p2p/escrow, exchanges
                await erc20.transfer(investor1, tokens(2000))           // investor purchases usdt token from escrow/exchanges/p2p/any secondary market

                // investor approves the htlc20 contract to move tokens from his wallet to fund the order
                await erc20.approve(htlc20.address, tokens(1000), {from: investor1})  // investor approves the htlc contract to move the tokens from his wallet to fund the order

                //  investor funds the order
                await htlc20.fundOrder(orderID, {from: investor1})
            })


            describe("Token swap", ()=>{

                let issuerWithdraws
                let investorWithdraws

                beforeEach(()=>{
                    issuerWithdraws = await htlc20.issuerWithdrawal(orderID, secret)
                })


                describe("issuer's withdrawal", async()=>{

                    it("emits the closed order when issuer withdraws the payment", async()=>{
                        issuerWithdraws.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event as the issuer withdraws the payment")
                    })

                })

                describe("investor withdrawal", ()=>{

                    let checkOrder
                    let revealedSecret
                    
                    beforeEach(async()=>{
                        checkOrder = await htlc20.checkOrder(orderID)
                    })

                    it("reveals the secret as the investor checks the order after withdrawal by the issuer", ()=>{

                        revealedSecret = checkOrder._secretKey

                    })

                    it("releases the security token to the investor as he provides the secret to withdraw from the htlc1400 contract", async()=>{
                        investorWithdraws = htlc1400.recipientWithdrawal(orderID, revealedSecret)
                    })

                })

            })

        })

    })

})