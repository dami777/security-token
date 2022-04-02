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

})