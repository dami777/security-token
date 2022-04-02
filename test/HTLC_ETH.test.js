require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ethers } = require("ethers");
const moment = require("moment");
const { ETHER_ADDRESS, tokens, swapState} = require("./helper.js")
const HTLC_ETH = artifacts.require("./HTLC_ETH")


contract ("HTLC for ETH Deposit", ([issuer, investor])=>{

    let htlcEth


    beforeEach(async()=>{
        htlcEth = await HTLC_ETH.new()
    })

    describe("contract address", ()=>{

        it("should have a contract address", ()=>{
            htlcEth.address.should.not.be.equal("", "it has a contract address")
        })

    })


    describe("fallback", ()=>{

        it("should revert if a call is made to any non existing function", async()=>{
            await htlcEth.sendTransaction({value: 1, from: issuer}).should.be.rejected
        })

    })

})