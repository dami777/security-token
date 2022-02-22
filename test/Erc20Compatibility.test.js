

const ERC1400 = artifacts.require('./ERC1400')
const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

const tokens=(n)=>{
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
    
}

require("chai")
    .use(require("chai-as-promised"))
    .should()


contract("ERC20 compatibility", ([holder1, holder2, escrow])=>{

    let token
    let name = "Tangl"
    let symbol = "TAN"
    let decimal = 18
    let totalSupply = 0
    let classA = web3.utils.asciiToHex("CLASS A")
    let classB = web3.utils.asciiToHex("CLASS B")



    beforeEach( async()=>{
        token = await ERC1400.new(name, symbol, decimal, totalSupply, [classA, classB])
    })
    

    describe("contract address", ()=>{

        it("has contract address", ()=>{
            token.address.should.not.be.equal("", "the contract has an address")
        })

    })

    describe("token transfer by holder", ()=>{

        beforeEach(async()=>{
            await token.issue(holder1, 10, web3.utils.toHex(""))
        })

        describe("success cases", ()=>{

            let transfer

            beforeEach(async()=>{
                transfer = await token.transfer(holder2, tokens(3), {from:holder1})
            })

            it("emits the transfer event", async()=>{
                transfer.logs[0].event.should.be.equal("Transfer", "it emits the Transfer event")
            })

            it("updates the balances of the sender and receiver", async()=>{
                const senderBalance = await token.balanceOf(holder1)
                const receiverBalance = await token.balanceOf(holder2)

                senderBalance.toString().should.be.equal(tokens(7).toString(), "the sender balance was deducted accordingly")
                receiverBalance.toString().should.be.equal(tokens(3).toString(), "the receiver balance increased accordingly")
            })
        })

        describe("failed cases", ()=>{

            it("fails to send tokens to address zero", async()=>{
                await token.transfer(ETHER_ADDRESS, tokens(3), {from: holder1}).should.be.rejected
            })

            it("fails to send due to insufficient token balance", async()=>{
                await token.transfer(holder2, tokens(30), {from: holder1}).should.be.rejected
            })
        })

        
    })

    describe("token transfer by external operators such as escrows", ()=>{

        describe("success cases", ()=>{

            let approval

            beforeEach(async()=>{
                approval = await token.approve(escrow, tokens(5))      // approve tokens to the escrow
                await token.issue(holder1, 10, web3.utils.toHex(""))    // issue tokens to this holder
            })


            it("emits the approve event", ()=>{
                approval.logs[0].event.should.be.equal("Approval", "it emits the Approval event")
            })

        })

    })

})