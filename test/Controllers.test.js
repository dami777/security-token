/**
 * @title   Operators and Controllers test script
 * @dev     Test script to test the operators and controllers operations and activities
 */

 require("chai")
    .use(require("chai-as-promised"))
    .should()



const ERC1400 = artifacts.require('./ERC1400')


const { stringToHex, setToken, certificate, tokens, ETHER_ADDRESS, reverts, tanglAdministratorPrivkey } = require("./helper")


contract("Controllers and Operators", ([tanglAdministrator1, investor_Dami, investor_Jeff, escrow, tanglAdministrator2, tanglAdministrator3, tanglAdministrator4])=>{

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

    let tanglDomainData

    
    //const salt = stringToHex("random").hex
    const salt = "0xa99ee9d3aab69713b85beaef7f222d0304b9c35e89072ae3c6e0cbabcccacc0a"


    beforeEach( async()=>{
        
        tanglSecurityToken = await ERC1400.new(tanglTokenDetails.name, tanglTokenDetails.symbol, tanglTokenDetails.decimal, {from: tanglAdministrator1})
        await tanglSecurityToken.setIssuable(true, {from: tanglAdministrator1})


        tanglDomainData = {

            name: tanglTokenDetails.name,
            version: "1",
            chainId: 1337,
            verifyingContract: tanglSecurityToken.address,
            salt: salt //"0x0daa2a09fd91f1dcd75517ddae4699d3ade05dd587e55dc861fe82551d2c0b66"
    
        }

    })
    

    describe("contract address", ()=>{

        it("has contract address", ()=>{
            tanglSecurityToken.address.should.not.be.equal("", "the contract has an address")
        })

    })

    /*describe("controllability status", ()=>{

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
    })*/

    describe("setting and removal of controllers", ()=>{


        /**
         * set controllers onchain
         */

        beforeEach(async()=>{

            await tanglSecurityToken.setController(tanglAdministrator2, {from: tanglAdministrator1})    
            await tanglSecurityToken.setController(tanglAdministrator3, {from: tanglAdministrator1})
            await tanglSecurityToken.setController(tanglAdministrator4, {from: tanglAdministrator1})

        })

        /*describe("Contoller's approval", ()=>{

            it("approves a controller", async()=>{

                const isTanglAdministrator2 = await tanglSecurityToken.isController(tanglAdministrator2)
                const isController2 = await tanglSecurityToken.isController(tanglAdministrator3)
    
                isTanglAdministrator2.should.be.equal(true, "address was approved to be a controller")
                isController2.should.be.equal(true, "address was approved to be a controller")

            })

            it("returns the size of the array of controllers", async()=>{

                const allControllers = await tanglSecurityToken.getControllers()
                allControllers.length.toString().should.be.equal("3", "returns the size of the array of controllers")
                
            })


            it("fails to reapprove an address that is already recognized as a controller", async()=>{

                await tanglSecurityToken.setController(tanglAdministrator4).should.be.rejectedWith(reverts.ADDRESS_IS_CONTROLLER)

            })

            it("fails to approve ether address as a controller", async()=>{

                await tanglSecurityToken.setController(ETHER_ADDRESS).should.be.rejectedWith(reverts.INVALID_TRANSFER_AGENT)

            })

        })

        describe("removal of controllers", ()=>{

            beforeEach(async()=>{

                await tanglSecurityToken.removeController(tanglAdministrator2)
                
            })


            it("disabled and removed tanglAdministrator2 from the allowed controllers", async()=>{
                const isTanglAdministrator2 = await tanglSecurityToken.isController(tanglAdministrator2)
                isTanglAdministrator2.should.be.equal(false, "controller was disabled")
            })

            it("returns the original array of controllers with the index of the disabled controller", async()=>{
                
                const allControllers = await tanglSecurityToken.getControllers()
                allControllers.length.toString().should.be.equal("3", "returns the size of the array of controllers")
           
            })

            it("reverts when the address to be removed is an ether address", async()=>{
                await tanglSecurityToken.removeController(ETHER_ADDRESS).should.be.rejectedWith(reverts.INVALID_TRANSFER_AGENT)
            })

            it("reverts when the address to be removed is not recognized as a controller", async()=>{
                await tanglSecurityToken.removeController(escrow).should.be.rejectedWith(reverts.INVALID_TRANSFER_AGENT)
            })

    
        })*/

        

    })

    describe("forced token transfer", ()=>{




        beforeEach(async()=>{

            let issuanceCert1 = await certificate(tanglAdministratorData, investorJeffData, 5, 1, tanglDomainData, tanglAdministratorPrivkey)
            let issuanceCert2 = await certificate(tanglAdministratorData, investorJeffData, 5, 2, tanglDomainData, tanglAdministratorPrivkey)

            await tanglSecurityToken.issueByPartition(classA.hex, investor_Jeff, 5, issuanceCert1, {from: tanglAdministrator1})  // issue tokens to an holder's partiton
            await tanglSecurityToken.issue(investor_Jeff, 5, issuanceCert2, {from: tanglAdministrator1})
            
            await tanglSecurityToken.setController(tanglAdministrator2, {from: tanglAdministrator1})    
            await tanglSecurityToken.setControllability(true)
                    
        })

        describe("token information", ()=>{
            
            it("updates the balance of the recipient", async()=>{

                const balance = await tanglSecurityToken.balanceOf(investor_Jeff)
                balance.toString().should.be.equal(tokens(10).toString(), "it updates the balance of the recipient")
           
            })

        })


        describe("forced token transfer from the default partition", ()=>{

            let forcedTransfer

            beforeEach(async()=>{

                let transferCert = await certificate(investorJeffData, investorDamiData, BigInt(tokens(2)), 1, tanglDomainData, tanglAdministratorPrivkey)
                
                forcedTransfer = await tanglSecurityToken.controllerTransfer(investor_Jeff, investor_Dami, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator2})

            })

            it("emits the transfer events and event data", ()=>{

                forcedTransfer.logs[0].event.should.be.equal("Transfer", "it emits the Transfer event")
                forcedTransfer.logs[1].event.should.be.equal("TransferByPartition", "it emits the Transfer event")
                forcedTransfer.logs[2].event.should.be.equal("ControllerTransfer", "it emits the Transfer event")
              
                forcedTransfer.logs[2].args._controller.should.be.equal(tanglAdministrator2, "it emits the controller that initiated the forced transfer")
                forcedTransfer.logs[2].args._from.should.be.equal(investor_Jeff, "it emits the token holder whose token was forcefully transferred")
                forcedTransfer.logs[2].args._to.should.be.equal(investor_Dami, "it emits the recipient of the forceful transfer")
                Number(forcedTransfer.logs[2].args._value).should.be.equal(Number(tokens(2)), "it emits the amount that was forcefully transferred")
                

            })

            it("updates the balances of the `from` and `to` accounts of the forcefull transfer", async()=>{

                const toBalance = await tanglSecurityToken.balanceOf(investor_Dami)
                const fromBalance = await tanglSecurityToken.balanceOf(investor_Jeff)

                Number(fromBalance).should.be.equal(Number(tokens(8)), "it updates the balance of the from")
                Number(toBalance).should.be.equal(Number(tokens(2)), "it updates the balance of the recipient")


            })

        })


        describe("forced transfer by partition by regulator/controller", ()=>{

            /**
             * if the token is controllable, controllers don't need to be approved as operators by the token holders
             * they can forcefully transfer tokens by from partitions using the operatorTransferByPartition
             */
            
            let forcedTransfer

            beforeEach(async()=>{

                let transferCert = await certificate(investorJeffData, investorDamiData, BigInt(tokens(2)), 1, tanglDomainData, tanglAdministratorPrivkey)

                forcedTransfer = await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Jeff, investor_Dami, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator2})
            
            })

            it("emits events", async()=>{

                forcedTransfer.logs[1].event.should.be.equal("TransferByPartition", "it emit the transfer by partition event")
                forcedTransfer.logs[2].event.should.be.equal("ControllerTransfer", "it emit the controller transfer event")
                forcedTransfer.logs[2].args._controller.should.be.equal(tanglAdministrator2, "it emits the controller that initiated the forced transfer")
                forcedTransfer.logs[2].args._from.should.be.equal(investor_Jeff, "it emits the token holder whose token was forcefully transferred")
                forcedTransfer.logs[2].args._to.should.be.equal(investor_Dami, "it emits the recipient of the forceful transfer")
                Number(forcedTransfer.logs[2].args._value).should.be.equal(Number(tokens(2)), "it emits the amount that was forcefully transferred")
            
                web3.utils.hexToUtf8(forcedTransfer.logs[1].args._fromPartition).should.be.equal("CLASS A", "it emits the partition where the token was transferred from")
                forcedTransfer.logs[1].args._operator.should.be.equal(tanglAdministrator2, "it emits the controller's address")
                forcedTransfer.logs[1].args._from.should.be.equal(investor_Jeff, "it emits the token holder whose tokens were transferred")
                forcedTransfer.logs[1].args._to.should.be.equal(investor_Dami, "it emits the recipient's address")
                Number(forcedTransfer.logs[1].args._value).should.be.equal(Number(tokens(2)), "it emits the amount that was forcefully transferred")
                
            })

            it("updates the balances of the accounts", async()=>{

                const balanceFrom = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Jeff)
                const balanceTo = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Dami)

                balanceFrom.toString().should.be.equal(tokens(3).toString(), "it updates the balance of the from account")
                balanceTo.toString().should.be.equal(tokens(2).toString(), "it updates the balance of the to account")
            })

        })


    })

    /*describe("forced transfer cannot happen when the control is turned off", ()=>{

        beforeEach(async()=>{
            await token.setControllability(false)
            await token.issueByPartition(classA, investor_Jeff, 5, web3.utils.toHex(""))  // issue tokens to an holder's partiton
            await token.setController(tanglAdministrator2)    //  set controller on chain
            await token.setController(signer)
        })

        it("fails to force token transfer because because the control is turned off", async()=>{
            await token.operatorTransferByPartition(classA, investor_Jeff, escrow, tokens(2), web3.utils.toHex(""), data, {from: tanglAdministrator2}).should.be.rejected
        })

        it("transfers after approving controller as an operator by the holder since control is turned", async()=>{
            await token.authorizeOperator(tanglAdministrator3, {from: investor_Jeff})
            await token.operatorTransferByPartition(classA, investor_Jeff, escrow, tokens(2), web3.utils.toHex(""), data, {from: tanglAdministrator3})
            const balanceFrom = await token.balanceOfByPartition(classA, investor_Jeff)
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
                await token.issueByPartition(classA, investor_Jeff, 5, web3.utils.toHex(""))  // issue tokens to an holder's partiton
                await token.setController(tanglAdministrator2)    //  set controller on chain
                redeem = await token.operatorRedeemByPartition(classA, investor_Jeff, tokens(2), data, {from:tanglAdministrator2})
                
            })


            it("emits Controller Redemption event", async()=>{
                redeem.logs[1].event.should.be.equal("ControllerRedemption", "it emits ControllerRedemption")
            })

            it("updates the balance of the token holder", async()=>{
                const balance = await token.balanceOfByPartition(classA, investor_Jeff)
                balance.toString().should.be.equal(tokens(3).toString(), "it updates the balance")
            })

        })   

        describe("redemption by approving operator when control is turned off", ()=>{
            
           

            beforeEach(async()=>{

                
                await token.setControllability(false)
                await token.setController(tanglAdministrator2) 
                await token.issueByPartition(classA, investor_Jeff, 5, web3.utils.toHex(""))  // issue tokens to an holder's partiton
                await token.setController(signer)
            })

            it("fails to redeem because control is turned off", async()=>{
                await token.operatorRedeemByPartition(classA, investor_Jeff, tokens(2), data, {from:tanglAdministrator2}).should.be.rejected
            })

            it("redeems after approving controller as an operator by the token holder", async()=>{
                await token.authorizeOperator(tanglAdministrator3, {from: investor_Jeff})
                const redeem = await token.operatorRedeemByPartition(classA, investor_Jeff, tokens(2), data, {from:tanglAdministrator3})
                const balance = await token.balanceOfByPartition(classA, investor_Jeff)

                balance.toString().should.be.equal(tokens(3).toString(), "it updates the balance")
                redeem.logs[0].event.should.be.equal("RedeemedByPartition", "it emits the redeem by partition event")

            })
        })

    })*/

})