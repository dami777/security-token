require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ethers, Contract } = require("ethers")
const moment = require("moment");
const { ETHER_ADDRESS, tokens, swapState} = require("./helper.js")

//  connect to the smart contract

const HTLC20 = artifacts.require("./HTLC20")
const ERC20_USDT = artifacts.require("./ERC20")     // this erc20 token will be represented as usdt


contract("HTLC20", ([USDT_DEPLOYER, investor1, investor2])=>{

    let htlc20 
    let erc20


    beforeEach(async()=>{

        
        erc20 = await ERC20_USDT.new("US Dollars Tether", "USDT")
        htlc20 = await HTLC20.new(erc20.address)
        

    })    


    describe("Contract deployment", ()=>{

        it("has a contract address", ()=>{

            htlc20.address.should.be.not.equal("", "the htlc contract for the erc20 token has an address")
            erc20.address.should.not.be.equal("", "the erc20_usdt has a contract address")
            

        })

    })

    describe("open order", ()=>{

        let openOrder
        let secret1 = web3.utils.asciiToHex("anonymous")
        let dataHex1 = web3.eth.abi.encodeParameter("bytes32", secret1)
        let secretHash = ethers.utils.sha256(dataHex1)
        let orderID = web3.utils.asciiToHex("x23dvsdgd")
        let expiration = new Date(moment().add(1, 'days').unix()).getTime()    // expiration will be present time + 1 day


        beforeEach(async()=>{

            openOrder = await htlc20.openOrder(orderID, investor1, tokens(1000), expiration, secretHash)

        })

        describe("successful open order", ()=>{

        })

        describe("failed open order", ()=>{

        })

        

    })

})