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

            it("reverts if a non regulator attempts to execute forceful transfer", async()=>{

                let transferCert = await certificate(investorJeffData, investorDamiData, BigInt(tokens(2)), 2, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.controllerTransfer(investor_Jeff, investor_Dami, tokens(2), transferCert, stringToHex("").hex, {from: escrow}).should.be.rejectedWith(reverts.RESTRICTED)


            })


            it("reverts if a forceful transfer is executed when the contract is uncontrollable", async()=>{

                let transferCert = await certificate(investorJeffData, investorDamiData, BigInt(tokens(2)), 3, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.setControllability(false)
                await tanglSecurityToken.controllerTransfer(investor_Jeff, investor_Dami, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator1}).should.be.rejectedWith(reverts.NOT_CONTROLLABLE)


            })


            it("reverts if the token owner has insufficient balance", async()=>{

                let transferCert = await certificate(investorJeffData, investorDamiData, BigInt(tokens(30)), 4, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.controllerTransfer(investor_Jeff, investor_Dami, tokens(30), transferCert, stringToHex("").hex, {from: tanglAdministrator1}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)


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


            it("reverts if a non regulator attempts to execute forceful transfer without being approved as an operator", async()=>{

                let transferCert = await certificate(investorJeffData, investorDamiData, BigInt(tokens(2)), 2, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Jeff, investor_Dami, tokens(2), transferCert, stringToHex("").hex, {from: escrow}).should.be.rejectedWith(reverts.RESTRICTED)


            })


            it("reverts if a forceful transfer is executed when the contract is uncontrollable and the caller is not an operator", async()=>{

                let transferCert = await certificate(investorJeffData, investorDamiData, BigInt(tokens(2)), 3, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.setControllability(false)
                await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Jeff, investor_Dami, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator1}).should.be.rejectedWith(reverts.RESTRICTED)


            })


            it("reverts if the token owner has insufficient balance", async()=>{

                let transferCert = await certificate(investorJeffData, investorDamiData, BigInt(tokens(30)), 4, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Jeff, investor_Dami, tokens(30), transferCert, stringToHex("").hex, {from: tanglAdministrator1}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)


            })


        })


    })

    /*describe("forced transfer cannot happen when the control is turned off", ()=>{

        let transferCert

        beforeEach(async()=>{

            await tanglSecurityToken.setController(tanglAdministrator2, {from: tanglAdministrator1})    //  set controller onchain


            let issuanceCert = await certificate(tanglAdministratorData, investorJeffData, 5, 1, tanglDomainData, tanglAdministratorPrivkey)
            transferCert = await certificate(investorJeffData, investorDamiData, BigInt(tokens(2)), 1, tanglDomainData, tanglAdministratorPrivkey)

            await tanglSecurityToken.setControllability(false)
            await tanglSecurityToken.issueByPartition(classA.hex, investor_Jeff, 5, issuanceCert, {from: tanglAdministrator2})  // issue tokens to an holder's partiton
            
            
        })

        it("fails to force token transfer because the control is turned off", async()=>{
            await tanglSecurityToken.operatorTransferByPartition(classA, investor_Jeff, investor_Dami, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator2}).should.be.rejected
        })

        it("transfers after approving controller as an operator by the holder when control is turned", async()=>{
            
            await tanglSecurityToken.authorizeOperator(tanglAdministrator3, {from: investor_Jeff})
            await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Jeff, investor_Dami, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator3})
            const balanceFrom = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Jeff)
            const balanceTo = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Dami)

            balanceFrom.toString().should.be.equal(tokens(3).toString(), "it updates the balance of the from account")
            balanceTo.toString().should.be.equal(tokens(2).toString(), "it updates the balance of the to account")
            
            
        })  

    })*/

    describe("controller redemption", ()=>{


        beforeEach(async()=>{

            let issuanceCert1 = await certificate(tanglAdministratorData, investorJeffData, 5, 1, tanglDomainData, tanglAdministratorPrivkey)
            let issuanceCert2 = await certificate(tanglAdministratorData, investorJeffData, 5, 2, tanglDomainData, tanglAdministratorPrivkey)

            await tanglSecurityToken.issueByPartition(classA.hex, investor_Jeff, 5, issuanceCert1, {from: tanglAdministrator1})  // issue tokens to an holder's partiton
            await tanglSecurityToken.issue(investor_Jeff, 5, issuanceCert2, {from: tanglAdministrator1})
            
            await tanglSecurityToken.setController(tanglAdministrator2, {from: tanglAdministrator1})    
            await tanglSecurityToken.setControllability(true)
                    
       
        })


        describe("redemption by default partition", ()=>{

        
           let controllerRedeem



           beforeEach(async()=>{
               /**
                * check balance and total suppley before forced redemption
                * controller calls the redeem function
                */
                totalSupplyBeforeForcedRedemption = await tanglSecurityToken.totalSupply()
                ownerBalanceBeforeRedemption = await tanglSecurityToken.balanceOf(investor_Jeff)


                const redemptionCert = await certificate(investorDamiData, redemptionData, BigInt(tokens(5)), 6, tanglDomainData, tanglAdministratorPrivkey)


                controllerRedeem =  await tanglSecurityToken.controllerRedeem(investor_Jeff, tokens(5), redemptionCert, stringToHex("").hex, {from: tanglAdministrator2})

           })


           it("emits event and event data", ()=>{

               controllerRedeem.logs[0].event.should.be.equal("ControllerRedemption", "it emits the controller redemption event")
               controllerRedeem.logs[0].args._controller.should.be.equal(tanglAdministrator2, "it emits the controller that called the function")
               controllerRedeem.logs[0].args._tokenHolder.should.be.equal(investor_Jeff, "it emits the token holder's address")
               Number(controllerRedeem.logs[0].args._value).should.be.equal(Number(tokens(5)), "it emits the number of tokens redeemed")
               

            })


           it("reduces the total supply and the balance of the token holder", async()=>{

                const totalSupplyAfterForcedRedemption = await tanglSecurityToken.totalSupply()
                const ownerBalanceAfterRedemption = await tanglSecurityToken.balanceOf(investor_Jeff)

                BigInt(totalSupplyAfterForcedRedemption).should.be.equal(BigInt(tokens(5)), "the total supply was reduced")
                BigInt(ownerBalanceAfterRedemption).should.be.equal(BigInt(tokens(5)), "the balance of the token holder was reduced")


           })

           it("reverts if forced redemption is attempted by a non regulator", async()=>{

                const redemptionCert = await certificate(investorDamiData, redemptionData, BigInt(tokens(5)), 7, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.controllerRedeem(investor_Jeff, tokens(5), redemptionCert, stringToHex("").hex, {from: escrow}).should.be.rejectedWith(reverts.RESTRICTED)

           })

           it("reverts if forced redemption is attempted when control is turned off", async()=>{
                
                await tanglSecurityToken.setControllability(false)

                const redemptionCert = await certificate(investorDamiData, redemptionData, BigInt(tokens(5)), 8, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.controllerRedeem(investor_Jeff, tokens(5), redemptionCert, stringToHex("").hex, {from: tanglAdministrator2}).should.be.rejectedWith(reverts.NOT_CONTROLLABLE)

           })

           it("reverts if the token holder has insufficient amount", async()=>{
            
                const redemptionCert = await certificate(investorDamiData, redemptionData, BigInt(tokens(5)), 9, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.controllerRedeem(investor_Jeff, tokens(10), redemptionCert, stringToHex("").hex, {from: tanglAdministrator2}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)

           })

        })

        describe("redemption by partition", ()=>{

           
           let controllerRedeem

            beforeEach(async()=>{

                /**
                * check balance and total suppley before forced redemption
                * controller calls the redeem function
                */

                totalSupplyBeforeForcedRedemption = await tanglSecurityToken.totalSupply()
                ownerBalanceBeforeRedemption = await tanglSecurityToken.balanceOf(investor_Jeff)

                const redemptionCert = await certificate(investorJeffData, redemptionData, BigInt(tokens(2)), 6, tanglDomainData, tanglAdministratorPrivkey)


                controllerRedeem = await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Jeff, tokens(2), redemptionCert, {from:tanglAdministrator2})
                
            })


            it("emits Controller Redemption event", async()=>{

                controllerRedeem.logs[0].event.should.be.equal("ControllerRedemption", "it emits ControllerRedemption")
                controllerRedeem.logs[0].args._controller.should.be.equal(tanglAdministrator2, "it emits the controller that called the function")
                controllerRedeem.logs[0].args._tokenHolder.should.be.equal(investor_Jeff, "it emits the token holder's address")
                BigInt(controllerRedeem.logs[0].args._value).should.be.equal(BigInt(tokens(2)), "it emits the number of tokens redeemed")
            
            })

            it("reduces the total supply and the balance of the token holder", async()=>{

                const totalSupplyAfterForcedRedemption = await tanglSecurityToken.totalSupply()
                const ownerBalanceAfterRedemption = await tanglSecurityToken.balanceOf(investor_Jeff)

                BigInt(totalSupplyAfterForcedRedemption).should.be.equal(BigInt(tokens(8)), "the total supply was reduced")
                BigInt(ownerBalanceAfterRedemption).should.be.equal(BigInt(tokens(8)), "the balance of the token holder was reduced")

           })

           it("reverts if forced redemption is attempted by a non regulator", async()=>{

                const redemptionCert = await certificate(investorJeffData, redemptionData, BigInt(tokens(5)), 7, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Jeff, tokens(2), redemptionCert, {from:escrow}).should.be.rejectedWith(reverts.RESTRICTED)

           })



            it("reverts if the token holder has insufficient amount", async()=>{
            
                const redemptionCert = await certificate(investorJeffData, redemptionData, BigInt(tokens(5)), 9, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Jeff, tokens(8), redemptionCert, {from:tanglAdministrator2}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)

            })

        })

        describe("redemption by approving operator when control is turned off", ()=>{
            
           

            beforeEach(async()=>{

                
                await tanglSecurityToken.setControllability(false)
                

            })

            it("fails to redeem because control is turned off", async()=>{
                const redemptionCert = await certificate(investorJeffData, redemptionData, BigInt(tokens(5)), 9, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Jeff, tokens(5), redemptionCert, {from:tanglAdministrator2}).should.be.rejectedWith(reverts.RESTRICTED)
            })

            it("redeems after approving controller as an operator by the token holder", async()=>{

                const redemptionCert = await certificate(investorJeffData, redemptionData, BigInt(tokens(2)), 9, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.authorizeOperator(tanglAdministrator2, {from: investor_Jeff})
                const redeem = await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Jeff, tokens(2), redemptionCert, {from:tanglAdministrator2})
                const balance = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Jeff)
                const totalSupply = await tanglSecurityToken.totalSupply()

                Number(balance).should.be.equal(Number(tokens(3)), "it updates the balance of the token holder")
                Number(totalSupply).should.be.equal(Number(tokens(8)), "it updates the total supply")
                redeem.logs[0].event.should.be.equal("RedeemedByPartition", "it emits the redeem by partition event")
                Number(redeem.logs[0].args._value).should.be.equal(Number(tokens(2)), "it emits the amount redeemed")
                web3.utils.hexToUtf8(redeem.logs[0].args._partition).should.be.equal("CLASS A", "it emits the partition the token was redeemed from")
                redeem.logs[0].args._from.should.be.equal(investor_Jeff, "it emits the token holder")
                redeem.logs[0].args._operator.should.be.equal(tanglAdministrator2, "it emits the operator")

            })
        })

    })

})