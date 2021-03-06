const { stringToHex, setToken, certificate, tokens, ETHER_ADDRESS, reverts, reitAdministratorPrivKey, tanglAdministratorPrivkey } = require("./helper")

const ERC1400 = artifacts.require("./ERC1400")

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract ("Partitionless Token", ([tanglAdministrator, reitAdministrator, investor_Dami, investor_Jeff, tanglRegulator])=>{


    let tanglSecurityToken
    let reitSecurityToken

    let tanglDomainData 
    let reitDomainData

    let classA = stringToHex("CLASS A")
    let classB = stringToHex("CLASS B")
    let classless = stringToHex("classless").hex

    
    
    
    let tanglTokenDetails = setToken("TANGL", "TAN", 18, 0, [classA.hex,classB.hex])
    let reitTokenDetails = setToken("Real Estate Investment Trust", "REIT", 18, 0, [classA.hex,classB.hex])


    /**
     * Define the data of the issuers and onboarded investors
     * These data will be used to generate certificate for issuance, transfer and redemption of tokens
     */

    let tanglAdministratorData = {
            
        firstName: "tangl administrator",
        lastName: "tangl administrator",
        location: "New Yoke, London",
        walletAddress: tanglAdministrator

    }



    let reitAdministratorData = {
            
        firstName: "reit administrator",
        lastName: "reit administrator",
        location: "New Yoke, London",
        walletAddress: reitAdministrator

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



    

    beforeEach(async()=>{

        /**
         * set the issuable status to true after contract deployment
         */
        
        tanglSecurityToken = await ERC1400.new(tanglTokenDetails.name, tanglTokenDetails.symbol, tanglTokenDetails.decimal, {from: tanglAdministrator})
        reitSecurityToken = await ERC1400.new(reitTokenDetails.name, reitTokenDetails.symbol, reitTokenDetails.decimal, {from: reitAdministrator})

        await tanglSecurityToken.setIssuable(true, {from: tanglAdministrator})
        await reitSecurityToken.setIssuable(true, {from: reitAdministrator})

        reitDomainData = {
        
            name: reitTokenDetails.name,
            version: "1",
            chainId: 1337,
            verifyingContract: reitSecurityToken.address,
            salt: salt //"0x0daa2a09fd91f1dcd75517ddae4699d3ade05dd587e55dc861fe82551d2c0b66"
    
        }

        tanglDomainData = {

            name: tanglTokenDetails.name,
            version: "1",
            chainId: 1337,
            verifyingContract: tanglSecurityToken.address,
            salt: salt //"0x0daa2a09fd91f1dcd75517ddae4699d3ade05dd587e55dc861fe82551d2c0b66"
    
        }


    })

    describe("contract deployment", ()=>{

        it("should have contract address", ()=>{
            tanglSecurityToken.address.should.not.be.equal("", "it has a contract contract")
            reitSecurityToken.address.should.not.be.equal("", "it has a contract contract")
            
        })

    })

    describe("issuance", ()=>{

        describe("issuance to partitionless token", ()=>{

            let issue
    
            beforeEach(async()=>{
    
    
                const cert = await certificate(tanglAdministratorData, investorDamiData, 1, 1, tanglDomainData, tanglAdministratorPrivkey)
                issue = await tanglSecurityToken.issue(investor_Dami, 1, cert, {from: tanglAdministrator})
    
            })
    
            
            it("isssues token to the classess/default partition of the recipient", async()=>{
    
                const investorDamiTotalBalance = await tanglSecurityToken.balanceOf(investor_Dami)
                const investorDamiClasslessBalance = await tanglSecurityToken.balanceOfByPartition(classless, investor_Dami)
                const totalSupply = await tanglSecurityToken.totalSupply()
    
                issue.logs[0].event.should.be.equal("Issued", "it emitted the issued event")
                issue.logs[0].args._to.should.be.equal(investor_Dami, "it emitted the recipient of the issuance")
                issue.logs[0].args._operator.should.be.equal(tanglAdministrator, "it emitted the operator of the issuance") 
                Number(issue.logs[0].args._value).should.be.equal(Number(tokens(1)), "it emitted the amount issued")
                
                Number(investorDamiTotalBalance).should.be.equal(Number(tokens(1)), "1 tangl token was issued to the investor")
                Number(investorDamiClasslessBalance).should.be.equal(Number(tokens(1)), "1 tangl token was issued to the investor's classless/partitionless balance")
                Number(totalSupply).should.be.equal(Number(tokens(1)), "total supply was updated")
    
            })
    
           
            
        })
    
        describe("issuance to specified partitions", ()=>{
    
            
    
            beforeEach(async()=>{
    
                reitDomainData = {
    
                    name: reitTokenDetails.name,
                    version: "1",
                    chainId: 1337,
                    verifyingContract: reitSecurityToken.address,
                    salt: salt //"0x0daa2a09fd91f1dcd75517ddae4699d3ade05dd587e55dc861fe82551d2c0b66"
            
                }
    
            })
    
            describe("successful issuance", async()=>{
    
                let issueByPartition
    
                beforeEach(async()=>{
                    const cert = await certificate(reitAdministratorData, investorDamiData, 1, 1, reitDomainData, reitAdministratorPrivKey)
                    issueByPartition = await reitSecurityToken.issueByPartition(classA.hex, investor_Dami, 1, cert, {from: reitAdministrator})
                })
    
    
                it("emitted event, event data and updated the partition balance of the recipient", async()=>{
    
                    const investorDamiTotalBalance = await reitSecurityToken.balanceOf(investor_Dami)
                    const investorDamiClassABalance = await reitSecurityToken.balanceOfByPartition(classA.hex, investor_Dami)
                    const totalSupply = await reitSecurityToken.totalSupply()
    
                    Number(investorDamiTotalBalance).should.be.equal(Number(tokens(1)), "1 tangl token was issued to the investor")
                    Number(investorDamiClassABalance).should.be.equal(Number(tokens(1)), "1 tangl token was issued to the investor's partition balance")
                    Number(totalSupply).should.be.equal(Number(tokens(1)), "total supply was updated")
    
    
                    issueByPartition.logs[0].event.should.be.equal("Issued", "it emitted the Issued event")
                    issueByPartition.logs[1].event.should.be.equal("IssuedByPartition", "it emitted the IssuedByPartition event")
                    web3.utils.hexToUtf8(issueByPartition.logs[1].args._partition).should.be.equal("CLASS A", "it emitted the issued partition")
                    issueByPartition.logs[1].args._operator.should.be.equal(reitAdministrator, "it emitted the operator of the issuance")
                    Number(issueByPartition.logs[1].args._value).should.be.equal(Number(tokens(1)), "it emitted the amount issued")
                    issueByPartition.logs[1].args._to.should.be.equal(investor_Dami, "it emitted the recipient of the issuance")
    
    
                })
    
            })
    
            describe("failed issuance", ()=>{
    
                let cert
    
                beforeEach(async()=>{
                    cert = await certificate(reitAdministratorData, investorDamiData, 1, 1, reitDomainData, reitAdministratorPrivKey)
                })
    
                it("should revert for issueing to ether zero", async()=>{
    
                    await reitSecurityToken.issue(ETHER_ADDRESS, 1, cert, {from: reitAdministrator}).should.be.rejectedWith(reverts.INVALID_RECEIVER)
                    await reitSecurityToken.issueByPartition(classA.hex, ETHER_ADDRESS, 1, cert, {from: reitAdministrator}).should.be.rejectedWith(reverts.INVALID_RECEIVER)
    
                })
    
                it("it reverts if issuance is attempted by addresses other than the contract owner or controllers", async()=>{
                
                    const cert = await certificate(tanglAdministratorData, investorDamiData, 1, 2, tanglDomainData, tanglAdministratorPrivkey)
                    await tanglSecurityToken.issue(investor_Dami, 1, cert, {from: reitAdministrator}).should.be.rejectedWith(reverts.RESTRICTED)
                    await tanglSecurityToken.issueByPartition(classA.hex, investor_Dami, 1, cert, {from: reitAdministrator}).should.be.rejectedWith(reverts.RESTRICTED)
    
                    
        
                })
    
                it("reverts if the certificate is empty", async()=>{
    
                    const cert = stringToHex("").hex
                    await tanglSecurityToken.issue(investor_Dami, 1, cert, {from: tanglAdministrator}).should.be.rejectedWith(reverts.EMPTY_DATA)
                    await reitSecurityToken.issueByPartition(classA.hex, investor_Dami, 1, cert, {from: reitAdministrator}).should.be.rejectedWith(reverts.EMPTY_DATA)
                    
                })
    
            })
    
        })
    
        describe("issuance by set controller", ()=>{
    
           
    
            beforeEach(async()=>{
    
                /**
                 * set a regulator / controller onchain
                 */
    
                await tanglSecurityToken.setController(tanglRegulator, {from: tanglAdministrator})
    
            })
     
            describe("controller issues to default partition", ()=>{
    
                let controllerIssue
    
                beforeEach(async()=>{
    
                    const cert = await certificate(tanglAdministratorData, investorDamiData, 1, 1, tanglDomainData, tanglAdministratorPrivkey)
                    
                    controllerIssue = await tanglSecurityToken.issue(investor_Dami, 1, cert, {from: tanglRegulator})
    
    
                })
    
    
                it("isssues token to the classess/default partition of the recipient", async()=>{
    
                    const investorDamiTotalBalance = await tanglSecurityToken.balanceOf(investor_Dami)
                    const investorDamiClasslessBalance = await tanglSecurityToken.balanceOfByPartition(classless, investor_Dami)
                    const totalSupply = await tanglSecurityToken.totalSupply()
        
                    controllerIssue.logs[0].event.should.be.equal("Issued", "it emitted the issued event")
                    controllerIssue.logs[0].args._to.should.be.equal(investor_Dami, "it emitted the recipient of the issuance")
                    controllerIssue.logs[0].args._operator.should.be.equal(tanglRegulator, "it emitted the operator of the issuance") 
                    Number(controllerIssue.logs[0].args._value).should.be.equal(Number(tokens(1)), "it emitted the amount issued")
                    
                    Number(investorDamiTotalBalance).should.be.equal(Number(tokens(1)), "1 tangl token was issued to the investor")
                    Number(investorDamiClasslessBalance).should.be.equal(Number(tokens(1)), "1 tangl token was issued to the investor's classless/partitionless balance")
                    Number(totalSupply).should.be.equal(Number(tokens(1)), "total supply was updated")
        
                })
    
    
    
                
    
    
                
    
            })
    
    
            describe("controller issues to specified partition", ()=>{
    
                let controllerIssueByPartition
    
                beforeEach(async()=>{
    
                    const cert = await certificate(tanglAdministratorData, investorDamiData, 1, 2, tanglDomainData, tanglAdministratorPrivkey)
                    
                    controllerIssueByPartition = await tanglSecurityToken.issueByPartition(classA.hex, investor_Dami, 1, cert, {from: tanglRegulator})
    
    
                })
    
    
    
                it("emitted event, event data and updated the partition balance of the recipient", async()=>{
    
                    const investorDamiTotalBalance = await tanglSecurityToken.balanceOf(investor_Dami)
                    const investorDamiClassABalance = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Dami)
                    const totalSupply = await tanglSecurityToken.totalSupply()
    
                    Number(investorDamiTotalBalance).should.be.equal(Number(tokens(1)), "1 tangl token was issued to the investor")
                    Number(investorDamiClassABalance).should.be.equal(Number(tokens(1)), "1 tangl token was issued to the investor's partition balance")
                    Number(totalSupply).should.be.equal(Number(tokens(1)), "total supply was updated")
    
    
                    controllerIssueByPartition.logs[0].event.should.be.equal("Issued", "it emitted the Issued event")
                    controllerIssueByPartition.logs[1].event.should.be.equal("IssuedByPartition", "it emitted the IssuedByPartition event")
                    web3.utils.hexToUtf8(controllerIssueByPartition.logs[1].args._partition).should.be.equal("CLASS A", "it emitted the issued partition")
                    controllerIssueByPartition.logs[1].args._operator.should.be.equal(tanglRegulator, "it emitted the operator of the issuance")
                    Number(controllerIssueByPartition.logs[1].args._value).should.be.equal(Number(tokens(1)), "it emitted the amount issued")
                    controllerIssueByPartition.logs[1].args._to.should.be.equal(investor_Dami, "it emitted the recipient of the issuance")
    
    
                })
            })
    
        })
    
        describe("disabled issuance", ()=>{
    
            let disabled 
    
            beforeEach(async()=>{
                disabled = await tanglSecurityToken.setIssuable(false)
            })
    
    
            it("reverts if issuance is attempted when issuance is disabled", async()=>{
                const cert = await certificate(tanglAdministratorData, investorDamiData, 1, 5, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.issue(investor_Dami, 1, cert, {from: tanglAdministrator}).should.be.rejectedWith(reverts.NOT_ISSUABLE)
            })
    
        })


        describe("Issuance status", ()=>{

            it("returns issuable as true", async()=>{
                const issuable = await tanglSecurityToken.isIssuable()
                issuable.should.be.equal(true, "it returns true as the issuance status")
            })


            it("returns issuable as false", async()=>{

                await tanglSecurityToken.setIssuable(false)
                const issuable = await tanglSecurityToken.isIssuable()
                issuable.should.be.equal(false, "it returns false as the issuance status")
            })

        })
    })

    
    describe("redemption", ()=>{

        beforeEach(async()=>{

            /**
             * set Issuance to true
             * Issue tokens
             * Redeem tokens
             */

            await tanglSecurityToken.setIssuable(true, {from: tanglAdministrator})


        })

        describe("redemption of the default partition", ()=>{

            let balanceBeforeRedemption
            let partitionBalanceBeforeRedemption
            let totalSupplyBeforeRedemption

            let redemption

            beforeEach(async()=>{

               
                const issuanceCert = await certificate(tanglAdministratorData, investorDamiData, 1, 7, tanglDomainData, tanglAdministratorPrivkey)
                const redemptionCert = await certificate(investorDamiData, redemptionData, BigInt(tokens(1)), 6, tanglDomainData, tanglAdministratorPrivkey)

                await tanglSecurityToken.issue(investor_Dami, 1, issuanceCert, {from: tanglAdministrator})
                
                balanceBeforeRedemption =  await tanglSecurityToken.balanceOf(investor_Dami)
                partitionBalanceBeforeRedemption = await tanglSecurityToken.balanceOfByPartition(classless, investor_Dami)
                totalSupplyBeforeRedemption = await tanglSecurityToken.totalSupply()

                redemption = await tanglSecurityToken.redeem(tokens(1), redemptionCert, {from: investor_Dami})

            })

            it("emits the redeem event", ()=>{

                redemption.logs[0].event.should.be.equal("Redeemed", "it emits the Redeemed event")
                redemption.logs[0].args._from.should.be.equal(investor_Dami, "it emits the redeemer's address")
                redemption.logs[0].args._operator.should.be.equal(investor_Dami, "it emits the operator's address")
                Number(redemption.logs[0].args._value).should.be.equal(Number(tokens(1)), "it emits the amount redeemed")
                
            })

            it("updates the balance of the token holder after redemption", async()=>{

                

                const balanceAfterRedemption =  await tanglSecurityToken.balanceOf(investor_Dami)
                const partitionBalanceAfterRedemption = await tanglSecurityToken.balanceOfByPartition(classless, investor_Dami)

                Number(balanceBeforeRedemption).should.be.equal(Number(tokens(1)), "it updates the balance of the token holder after issuance")
                Number(partitionBalanceBeforeRedemption).should.be.equal(Number(tokens(1)), "it updates the classless partition balance of the token holder after issuance")

                Number(balanceAfterRedemption).should.be.equal(0, "it updates the balance of the token holder after redemption")
                Number(partitionBalanceAfterRedemption).should.be.equal(0, "it updates the classless partition balance of the token holder after redemption")


            })


            it("updates the total supply", async()=>{

                const totalSupplyAfterRedemption = await tanglSecurityToken.totalSupply()

                Number(totalSupplyBeforeRedemption).should.be.equal(Number(tokens(1)), "the total supply before redemption")
                Number(totalSupplyAfterRedemption).should.be.equal(0, "the total supply after redemption")


            })

            it("fails to redeem due to insufficient amount to redeem", async()=>{

                const redemptionCert = await certificate(investorDamiData, redemptionData, BigInt(tokens(1)), 9, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.redeem(tokens(1), redemptionCert, {from: investor_Dami}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)                

            })





        })


        describe("redemption of a specific partition", ()=>{

            let balanceBeforeRedemption
            let partitionBalanceBeforeRedemption
            let totalSupplyBeforeRedemption

            let redemption

            beforeEach(async()=>{

                const issuanceCert = await certificate(tanglAdministratorData, investorDamiData, 1, 9, tanglDomainData, tanglAdministratorPrivkey)
                const redemptionCert = await certificate(investorDamiData, redemptionData, BigInt(tokens(1)), 10, tanglDomainData, tanglAdministratorPrivkey)

                await tanglSecurityToken.issueByPartition(classA.hex, investor_Dami, 1, issuanceCert, {from: tanglAdministrator})
                
                balanceBeforeRedemption =  await tanglSecurityToken.balanceOf(investor_Dami)
                partitionBalanceBeforeRedemption = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Dami)
                totalSupplyBeforeRedemption = await tanglSecurityToken.totalSupply()

                redemption = await tanglSecurityToken.redeemByPartition(classA.hex, tokens(1), redemptionCert, {from: investor_Dami})

            })


            it("emits the redeem by partition event", ()=>{

                redemption.logs[0].event.should.be.equal("RedeemedByPartition", "it emits the RedeemedByPartition event")
                redemption.logs[0].args._from.should.be.equal(investor_Dami, "it emits the redeemer's address")
                redemption.logs[0].args._operator.should.be.equal(investor_Dami, "it emits the operator's address")
                Number(redemption.logs[0].args._value).should.be.equal(Number(tokens(1)), "it emits the amount redeemed")
                web3.utils.hexToUtf8(redemption.logs[0].args._partition).should.be.equal("CLASS A", "it emits the redeemed partition")

            })

            it("updates the balance of the token holder after redemption", async()=>{

                

                const balanceAfterRedemption =  await tanglSecurityToken.balanceOf(investor_Dami)
                const partitionBalanceAfterRedemption = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Dami)

                Number(balanceBeforeRedemption).should.be.equal(Number(tokens(1)), "it updates the balance of the token holder after issuance")
                Number(partitionBalanceBeforeRedemption).should.be.equal(Number(tokens(1)), "it updates the partition balance of the token holder after issuance")

                Number(balanceAfterRedemption).should.be.equal(0, "it updates the balance of the token holder after redemption")
                Number(partitionBalanceAfterRedemption).should.be.equal(0, "it updates the partition balance of the token holder after redemption")


            })

            it("updates the total supply", async()=>{

                const totalSupplyAfterRedemption = await tanglSecurityToken.totalSupply()

                Number(totalSupplyBeforeRedemption).should.be.equal(Number(tokens(1)), "the total supply before redemption")
                Number(totalSupplyAfterRedemption).should.be.equal(0, "the total supply after redemption")


            })


            it("fails to redeem due to insufficient amount to redeem", async()=>{

                const redemptionCert = await certificate(investorDamiData, redemptionData, BigInt(tokens(1)), 9, tanglDomainData, tanglAdministratorPrivkey)
                
                await tanglSecurityToken.redeemByPartition(classA.hex, tokens(1), redemptionCert, {from: investor_Dami}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)                


            })



            
           
        })

        describe("redeemFrom", ()=>{


            let balanceBeforeRedemption
            let partitionBalanceBeforeRedemption
            let totalSupplyBeforeRedemption
            let redemptionCert

            beforeEach(async()=>{

                const issuanceCert = await certificate(tanglAdministratorData, investorDamiData, 1, 7, tanglDomainData, tanglAdministratorPrivkey)
                redemptionCert = await certificate(investorDamiData, redemptionData, BigInt(tokens(1)), 6, tanglDomainData, tanglAdministratorPrivkey)
                await tanglSecurityToken.issue(investor_Dami, 1, issuanceCert, {from: tanglAdministrator})

            })

            describe("successful redemption", async()=>{

                let redeemFrom

                beforeEach(async()=>{

                    balanceBeforeRedemption =  await tanglSecurityToken.balanceOf(investor_Dami)
                    partitionBalanceBeforeRedemption = await tanglSecurityToken.balanceOfByPartition(classless, investor_Dami)
                    totalSupplyBeforeRedemption = await tanglSecurityToken.totalSupply()
                        
                    await tanglSecurityToken.approve(tanglAdministrator, tokens(1), {from: investor_Dami})
                    redeemFrom = await tanglSecurityToken.redeemFrom(investor_Dami, tokens(1), redemptionCert, {from: tanglAdministrator})

                })


                it("emits event and event data", async()=>{

                    redeemFrom.logs[0].event.should.be.equal("Redeemed", "it emits the redeemed event")
                    redeemFrom.logs[0].args._operator.should.be.equal(tanglAdministrator, "it emits the operator's address")
                    redeemFrom.logs[0].args._from.should.be.equal(investor_Dami, "it emits the tokenHolder's address")


                })

                it("updates the tokenHolder's balance and total supply", async()=>{

                    const balanceAfterRedemption =  await tanglSecurityToken.balanceOf(investor_Dami)
                    const partitionBalanceAfterRedemption = await tanglSecurityToken.balanceOfByPartition(classless, investor_Dami)

                    Number(balanceBeforeRedemption).should.be.equal(Number(tokens(1)), "it updates the balance of the token holder after issuance")
                    Number(partitionBalanceBeforeRedemption).should.be.equal(Number(tokens(1)), "it updates the partitionless balance of the token holder after issuance")

                    Number(balanceAfterRedemption).should.be.equal(0, "it updates the balance of the token holder after redemption")
                    Number(partitionBalanceAfterRedemption).should.be.equal(0, "it updates the partitionless balance of the token holder after redemption")
                
                })

            })

            describe("failed redeem from", ()=>{

                it("fails to redeem for insufficient approval", async()=>{
                    
                    await tanglSecurityToken.redeemFrom(investor_Dami, tokens(2), redemptionCert, {from: tanglAdministrator}).should.be.rejectedWith(reverts.INSUFFICIENT_ALLOWANCE)

                })

                it("should revert due to insufficient balance", async()=>{

                    await tanglSecurityToken.approve(tanglAdministrator, tokens(2), {from: investor_Dami})
                    await tanglSecurityToken.redeemFrom(investor_Dami, tokens(2), redemptionCert, {from: tanglAdministrator}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)

                })

                
            })

        })

    })
})

