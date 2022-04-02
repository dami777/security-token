require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ethers } = require("ethers");
const { before } = require("lodash");
const moment = require("moment");
const { ETHER_ADDRESS, tokens, swapState,ether} = require("./helper.js")
const HTLC_ETH = artifacts.require("./HTLC_ETH")
const ReEntrancy = artifacts.require("./ReEntrancy")


contract ("HTLC for ETH Deposit", ([issuer, investor])=>{

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


    describe("open order", ()=>{

        let secret_phrase = "anonymous"
        let secretBytes32 = web3.utils.asciiToHex(secret_phrase)
        let dataHex1 = web3.eth.abi.encodeParameter("bytes32", secretBytes32)
        let secretHash = ethers.utils.sha256(dataHex1)
        let orderID = web3.utils.asciiToHex("x23dvsdgd")
        let expiration = new Date(moment().add(1, 'days').unix()).getTime()     // expiration will be present time + 1 day
        let classA = web3.utils.asciiToHex("CLASS A")
        let price = ether(1)                                                // price of the asset
        let amount = tokens(10)
        let order
        
        
        beforeEach(async()=>{
            order = await htlcEth.openOrder(orderID, investor, price, amount, expiration, secretHash, secretBytes32, classA)
        })

        it("emits the open order event", ()=>{
            order.logs[0].event.should.be.equal("OpenedOrder", "it emits the OpenedOrder event")
        })

    })



})