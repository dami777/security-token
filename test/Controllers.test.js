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
    let signature = "0x9292906193066a70b863da0861b6ea2e366074a455a4c5f6b1a79e7347734e4c72e3b654f028795e7eb8b7762a0be9b249484ac3586f809ba1bc072afe1713191b"
    let ethHash = "0xa420c3c01ff29855b5c7421b2a235747e80195ebea4a0eecde39229964686d97"
    let signer  = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"
    let fromIsWhiteListedOrIssuer = true
    let toIsWhiteListed = true
    let data =  web3.eth.abi.encodeParameters(["bytes", "bytes32", "bool", "bool"], [signature, ethHash, fromIsWhiteListedOrIssuer, toIsWhiteListed])



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
            await token.issueByPartition(classA, holder2, 5, web3.utils.toHex(""))  // issue tokens to an holder's partiton
            await token.setController(controller1)    //  set controller on chain
        })

        describe("token information", ()=>{
            
            it("updates the balance of the recipient", async()=>{
                const balance = await token.balanceOfByPartition(classA, holder2)
                balance.toString().should.be.equal(tokens(5).toString(), "it updates the balance of the recipient")
            })

        })

        describe("forced transfer by partition by regulator/controller", ()=>{
            
            let transfer

            beforeEach(async()=>{
                await token.setController(signer)
                transfer = await token.operatorTransferByPartition(classA, holder2, escrow, tokens(2), web3.utils.toHex(""), data, {from: controller1})
            })

            it("emits events", async()=>{
                transfer.logs[0].event.should.be.equal("TransferByPartition", "it emit the transfer by partition event")
                transfer.logs[2].event.should.be.equal("ControllerTransfer", "it emit the controller transfer event")
            })

            it("updates the balances of the accounts", async()=>{
                const balanceFrom = await token.balanceOfByPartition(classA, holder2)
                const balanceTo = await token.balanceOfByPartition(classA, escrow)

                balanceFrom.toString().should.be.equal(tokens(3).toString(), "it updates the balance of the from account")
                balanceTo.toString().should.be.equal(tokens(2).toString(), "it updates the balance of the to account")
            })

        })


    })

    describe("forced transfer cannot happen when the control is turned off", ()=>{

        beforeEach(async()=>{
            await token.setControllability(false)
            await token.issueByPartition(classA, holder2, 5, web3.utils.toHex(""))  // issue tokens to an holder's partiton
            await token.setController(controller1)    //  set controller on chain
            await token.setController(signer)
        })

        it("fails to force token transfer because because the control is turned off", async()=>{
            await token.operatorTransferByPartition(classA, holder2, escrow, tokens(2), web3.utils.toHex(""), data, {from: controller1}).should.be.rejected
        })

        it("transfers after approving controller as an operator by the holder since control is turned", async()=>{
            await token.authorizeOperator(controller2, {from: holder2})
            await token.operatorTransferByPartition(classA, holder2, escrow, tokens(2), web3.utils.toHex(""), data, {from: controller2})
            const balanceFrom = await token.balanceOfByPartition(classA, holder2)
            const balanceTo = await token.balanceOfByPartition(classA, escrow)

            balanceFrom.toString().should.be.equal(tokens(3).toString(), "it updates the balance of the from account")
            balanceTo.toString().should.be.equal(tokens(2).toString(), "it updates the balance of the to account")
            
            
        })  

    })

    describe("controller redemption", ()=>{

        describe("redemption by control", ()=>{

            let redeem

            beforeEach(async()=>{
                await token.setController(signer)
                await token.issueByPartition(classA, holder2, 5, web3.utils.toHex(""))  // issue tokens to an holder's partiton
                await token.setController(controller1)    //  set controller on chain
                redeem = await token.operatorRedeemByPartition(classA, holder2, tokens(2), data, {from:controller1})
                
            })


            it("emits Controller Redemption event", async()=>{
                redeem.logs[1].event.should.be.equal("ControllerRedemption", "it emits ControllerRedemption")
            })

            it("updates the balance of the token holder", async()=>{
                const balance = await token.balanceOfByPartition(classA, holder2)
                balance.toString().should.be.equal(tokens(3).toString(), "it updates the balance")
            })

        })   

        describe("redemption by approving operator when control is turned off", ()=>{
            
           

            beforeEach(async()=>{

                
                await token.setControllability(false)
                await token.setController(controller1) 
                await token.issueByPartition(classA, holder2, 5, web3.utils.toHex(""))  // issue tokens to an holder's partiton
                await token.setController(signer)
            })

            it("fails to redeem because control is turned off", async()=>{
                await token.operatorRedeemByPartition(classA, holder2, tokens(2), data, {from:controller1}).should.be.rejected
            })

            it("redeems after approving controller as an operator by the token holder", async()=>{
                await token.authorizeOperator(controller2, {from: holder2})
                const redeem = await token.operatorRedeemByPartition(classA, holder2, tokens(2), data, {from:controller2})
                const balance = await token.balanceOfByPartition(classA, holder2)

                balance.toString().should.be.equal(tokens(3).toString(), "it updates the balance")
                redeem.logs[0].event.should.be.equal("RedeemedByPartition", "it emits the redeem by partition event")

            })
        })

    })

})