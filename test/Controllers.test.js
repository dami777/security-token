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


contract("Controllers", ([issuer, holder2, escrow, controller1, controller2, controller3])=>{

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

    describe("controllability status", ()=>{

        it("can control tokens", async()=>{

            const canControl = await token.isControllable()
            canControl.should.be.equal(true, "token can be controlled")
        })

        it("can't be controlled", async()=>{
            await token.setControllability(false)
            const canControl = await token.isControllable()
            canControl.should.be.equal(false, "tokens can'e be controlled")
        })
    })

    describe("setting and removal of controllers", ()=>{

        beforeEach(async()=>{
            await token.setController(controller1)    //  set controllers on chain
            await token.setController(controller2)
            await token.setController(controller3)
        })

        describe("Contoller's approval", ()=>{

            it("approves a controller", async()=>{
                const isController1 = await token.isController(controller1)
                const isController2 = await token.isController(controller2)
    
                isController1.should.be.equal(true, "address was approved to be a controller")
                isController2.should.be.equal(true, "address was approved to be a controller")
            })

            it("returns the size of the array of controllers", async()=>{
                const allControllers = await token.getControllers()
                allControllers.length.toString().should.be.equal("3", "returns the size of the array of controllers")
                
            })


            it("fails to reapprove an address that is already recognized as a controller", async()=>{
                await token.setController(controller3).should.be.rejected
            })

        })

        describe("removal of controllers", ()=>{

            beforeEach(async()=>{
                await token.removeController(controller1)
                
            })


            it("disabled and removed controller1 from the allowed controllers", async()=>{
                const isController1 = await token.isController(controller1)
                isController1.should.be.equal(false, "controller was disabled")
            })

            it("returns the original array of controllers with the index of the disabled controller", async()=>{
                const allControllers = await token.getControllers()
                allControllers.length.toString().should.be.equal("3", "returns the size of the array of controllers")
            })

            it("reverts when the address to be removed is an ether address", async()=>{
                await token.removeController(ETHER_ADDRESS).should.be.rejected
            })

            it("reverts when the address to be removed is not recognized as a controller", async()=>{
                await token.removeController(escrow).should.be.rejected
            })

    
        })

        

    })

    describe("controller can transfer without operator management", ()=>{

        beforeEach(async()=>{
            await token.issueByPartition(classA, holder2, token(5), web3.utils.toHex(""))  // issue tokens to an holder's partiton
        })

        describe("token information", ()=>{
            
            it("updates the balance of the recipient", async()=>{
                const balance = await token.balanceOfByPartition(holder2, classA)
                balance.toString().should.be.equal(token(5).toString(), "it updates the balance of the recipient")
            })

        })

        

    })





})