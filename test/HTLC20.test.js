require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ethers, Contract } = require("ethers")
const moment = require("moment");


//  connect to the smart contract

const HTLC20 = artifacts.require("./HTLC20")
const ERC20_USDT = artifacts.require("./ERC20")     // this erc20 token will be represented as usdt


Contract("HTLC20", ([USDT_DEPLOYER, investor1, investor2])=>{

    let htlc20 
    let erc20

    let name = "Tangl"
    let symbol = "TAN"
    let decimal = 18
    let totalSupply = 0
    let classA = web3.utils.asciiToHex("CLASS A")
    let classB = web3.utils.asciiToHex("CLASS B")

    beforeEach(async()=>{

        
        erc20 = await ERC20_USDT.new("US Dollars Tether", "USDT")
        htlc20 = await HTLC20.new(erc20.address)
        

        await erc1400.setController(signer)
    })    


    describe("Contract deployment", ()=>{

        it("has a contract address", ()=>{

            htlc20.address.should.be.not.equal("", "the htlc contract for the erc20 token has an address")
            erc20.address.should.not.be.equal("", "the erc20_usdt has a contract address")
            

        })

    })

})