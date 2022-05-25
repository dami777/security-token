/**
 * @title   Operators and Controllers test script
 * @dev     Test script to test the operators and controllers operations and activities
 */

 require("chai")
    .use(require("chai-as-promised"))
    .should()



const ERC1400 = artifacts.require('./ERC1400')

const { stringToHex, setToken, certificate, tokens, ETHER_ADDRESS, reverts } = require("./helper")


contract("Controllers and Operators", ([tanglAdministrator1, investor_Dami, investor_Jeff, holder2, escrow, tanglAdministrator2, tanglAdministrator3, tanglAdministrator4])=>{

    let tanglSecurityToken

    let classA = stringToHex("CLASS A")
    let classB = stringToHex("CLASS B")
    let classless = stringToHex("classless").hex

    let tanglTokenDetails = setToken("TANGL", "TAN", 18, 0, [classA.hex,classB.hex])



     /**
     * Define the data of the issuers and onboarded investors
     * These data will be used to generate certificate for issuance, transfer and redemption of tokens
     */

      let tanglAdministratorData = {
            
        firstName: "tangl administrator",
        lastName: "tangl administrator",
        location: "New Yoke, London",
        walletAddress: tanglAdministrator1

    }

    let investorDamiData = {

        firstName: "Dami",
        lastName: "Ogunkeye",
        location: "New Yoke, London",
        walletAddress: investor_Dami

    }


    let investorJeffData = {

        firstName: "Jeff",
        lastName: "Chuka",
        location: "New Yoke, London",
        walletAddress: investor_Jeff

    }

    let redemptionData = {

        firstName: "address zero",
        lastName: "address zero",
        location: "address zero",
        walletAddress: ETHER_ADDRESS

    }

    
    //const salt = stringToHex("random").hex
    const salt = "0xa99ee9d3aab69713b85beaef7f222d0304b9c35e89072ae3c6e0cbabcccacc0a"


    beforeEach( async()=>{
        
        tanglSecurityToken = await ERC1400.new(tanglTokenDetails.name, tanglTokenDetails.symbol, tanglTokenDetails.decimal, {from: tanglAdministrator1})

    })
    

    describe("contract address", ()=>{

        it("has contract address", ()=>{
            tanglSecurityToken.address.should.not.be.equal("", "the contract has an address")
        })

    })

    describe("controllability status", ()=>{

        it("can't control tokens", async()=>{

            const canControl = await tanglSecurityToken.isControllable()
            canControl.should.be.equal(false, "token can not be controlled")
        })

        it("can be controlled after setting the controllability status", async()=>{
            const setControl = await tanglSecurityToken.setControllability(true)
            const canControl = await tanglSecurityToken.isControllable()
            canControl.should.be.equal(true, "tokens can be controlled")
            setControl.logs[0].event.should.be.equal("SetControllability", "it emits the SetControllability event")
            setControl.logs[0].args._isControllable.should.be.equal(true, "it emits the status of the controllability")
        })
    })

    /*describe("setting and removal of controllers", ()=>{

        beforeEach(async()=>{
            await token.setController(tanglAdministrator2)    //  set controllers on chain
            await token.setController(tanglAdministrator3)
            await token.setController(tanglAdministrator4)
        })

        describe("Contoller's approval", ()=>{

            it("approves a controller", async()=>{
                const istanglAdministrator2 = await token.isController(tanglAdministrator2)
                const isController2 = await token.isController(tanglAdministrator3)
    
                istanglAdministrator2.should.be.equal(true, "address was approved to be a controller")
                isController2.should.be.equal(true, "address was approved to be a controller")
            })

            it("returns the size of the array of controllers", async()=>{
                const allControllers = await token.getControllers()
                allControllers.length.toString().should.be.equal("3", "returns the size of the array of controllers")
                
            })


            it("fails to reapprove an address that is already recognized as a controller", async()=>{
                await token.setController(tanglAdministrator4).should.be.rejected
            })

        })

        describe("removal of controllers", ()=>{

            beforeEach(async()=>{
                await token.removeController(tanglAdministrator2)
                
            })


            it("disabled and removed tanglAdministrator2 from the allowed controllers", async()=>{
                const istanglAdministrator2 = await token.isController(tanglAdministrator2)
                istanglAdministrator2.should.be.equal(false, "controller was disabled")
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
            await token.setController(tanglAdministrator2)    //  set controller on chain
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
                transfer = await token.operatorTransferByPartition(classA, holder2, escrow, tokens(2), web3.utils.toHex(""), data, {from: tanglAdministrator2})
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
            await token.setController(tanglAdministrator2)    //  set controller on chain
            await token.setController(signer)
        })

        it("fails to force token transfer because because the control is turned off", async()=>{
            await token.operatorTransferByPartition(classA, holder2, escrow, tokens(2), web3.utils.toHex(""), data, {from: tanglAdministrator2}).should.be.rejected
        })

        it("transfers after approving controller as an operator by the holder since control is turned", async()=>{
            await token.authorizeOperator(tanglAdministrator3, {from: holder2})
            await token.operatorTransferByPartition(classA, holder2, escrow, tokens(2), web3.utils.toHex(""), data, {from: tanglAdministrator3})
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
                await token.setController(tanglAdministrator2)    //  set controller on chain
                redeem = await token.operatorRedeemByPartition(classA, holder2, tokens(2), data, {from:tanglAdministrator2})
                
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
                await token.setController(tanglAdministrator2) 
                await token.issueByPartition(classA, holder2, 5, web3.utils.toHex(""))  // issue tokens to an holder's partiton
                await token.setController(signer)
            })

            it("fails to redeem because control is turned off", async()=>{
                await token.operatorRedeemByPartition(classA, holder2, tokens(2), data, {from:tanglAdministrator2}).should.be.rejected
            })

            it("redeems after approving controller as an operator by the token holder", async()=>{
                await token.authorizeOperator(tanglAdministrator3, {from: holder2})
                const redeem = await token.operatorRedeemByPartition(classA, holder2, tokens(2), data, {from:tanglAdministrator3})
                const balance = await token.balanceOfByPartition(classA, holder2)

                balance.toString().should.be.equal(tokens(3).toString(), "it updates the balance")
                redeem.logs[0].event.should.be.equal("RedeemedByPartition", "it emits the redeem by partition event")

            })
        })

    })*/

})