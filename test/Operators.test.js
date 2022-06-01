
const ERC1400 = artifacts.require("./ERC1400")


require("chai")
    .use(require("chai-as-promised"))
    .should()
    
const { stringToHex, setToken, certificate, tokens, ETHER_ADDRESS, reverts, tanglAdministratorPrivkey } = require("./helper")


contract("ERC1400", ([tanglAdministrator, investor_Dami, investor_Jeff, tanglAdministrator2, tanglAdministrator3])=>{

    
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
        walletAddress: tanglAdministrator

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
        
        tanglSecurityToken = await ERC1400.new(tanglTokenDetails.name, tanglTokenDetails.symbol, tanglTokenDetails.decimal, {from: tanglAdministrator})
        await tanglSecurityToken.setIssuable(true, {from: tanglAdministrator})
        


        tanglDomainData = {

            name: tanglTokenDetails.name,
            version: "1",
            chainId: 1337,
            verifyingContract: tanglSecurityToken.address,
            salt: salt //"0x0daa2a09fd91f1dcd75517ddae4699d3ade05dd587e55dc861fe82551d2c0b66"
    
        }

    })
    

    describe("contract deployment", ()=>{

        it("has a contract address", ()=>{

            tanglSecurityToken.address.should.not.be.equal("", "it has a contract address")
        
        })

    })

    
    describe("authorize and revoke operators", ()=>{


        describe("authorize operators across all partitions", ()=>{


            it("returns false for the operator's status across all partitions", async()=>{

                const isOperator = await tanglSecurityToken.isOperator(tanglAdministrator2, investor_Dami)
                isOperator.should.be.equal(false, "not an operator for the token holder's partitions")
            
            })

            it("authorizes an operator for a token holder across all parititons", async()=>{

                const authorizeOperator = await tanglSecurityToken.authorizeOperator(tanglAdministrator2, {from: investor_Dami})
                const isOperator = await tanglSecurityToken.isOperator(tanglAdministrator2, investor_Dami)
                
                isOperator.should.be.equal(true, "investor authorizes an operator across all partitions of his token")
                authorizeOperator.logs[0].event.should.be.equal("AuthorizedOperator", "it emits the authorized operator event")
                authorizeOperator.logs[0].args._operator.should.be.equal(tanglAdministrator2, "it emits the authorized operator")
                authorizeOperator.logs[0].args._tokenHolder.should.be.equal(investor_Dami, "it emits the token holder")



            })


        })

        describe("revoke operators across all partititons", ()=>{

            /**
             * revoke an authorized operator
             */

            beforeEach(async()=>{

                await tanglSecurityToken.authorizeOperator(tanglAdministrator2, {from: investor_Dami})

            })

            it("authorizes the operator", async()=>{

                const isOperator = await tanglSecurityToken.isOperator(tanglAdministrator2, investor_Dami)              
                isOperator.should.be.equal(true, "investor authorizes an operator across all partitions of his token")
            
            })

            it("revokes the operator across all partitions", async()=>{

                const revokeOperator = await tanglSecurityToken.revokeOperator(tanglAdministrator2, {from: investor_Dami})
                const isOperator = await tanglSecurityToken.isOperator(tanglAdministrator2, investor_Dami)              
                isOperator.should.be.equal(false, "investor revokes an operator across all partitions of his token")
            
                revokeOperator.logs[0].event.should.be.equal("RevokedOperator", "it emits the revoked operator event")
                revokeOperator.logs[0].args._operator.should.be.equal(tanglAdministrator2, "it emits the revoked operator's address")
                revokeOperator.logs[0].args._tokenHolder.should.be.equal(investor_Dami, "it emits the address of the token holder")

            })

        })


        describe("authorize operator across a specific partition", ()=>{

            it("returns false as the default status for operators before authorization", async()=>{
                
                const isOperatorForPartition = await tanglSecurityToken.isOperatorForPartition(classA.hex, tanglAdministrator2, investor_Dami)
                isOperatorForPartition.should.be.equal(false, "by default, no address is an operator for any token holder until they are authorized")

            })

            it("authorizes an operator for a specific partition", async()=>{

                const authorizeOperatorForClassA = await tanglSecurityToken.authorizeOperatorByPartition(classA.hex, tanglAdministrator2, {from: investor_Dami})
                const isOperatorForPartition = await tanglSecurityToken.isOperatorForPartition(classA.hex, tanglAdministrator2, investor_Dami)
            
                isOperatorForPartition.should.be.equal(true, "operator approved for partition by token holder")
                authorizeOperatorForClassA.logs[0].event.should.be.equal("AuthorizedOperatorByPartition", "it emits the authorized operator by partition event")
                web3.utils.hexToUtf8(authorizeOperatorForClassA.logs[0].args._partition).should.be.equal("CLASS A", "it emits the partition where access was granted to the operator")
                authorizeOperatorForClassA.logs[0].args._operator.should.be.equal(tanglAdministrator2, "it emits the operator's address")
                authorizeOperatorForClassA.logs[0].args._tokenHolder.should.be.equal(investor_Dami, "it emits the token holder's address")


            })

        })

        describe("revoke operators for a specific partition", ()=>{

            /**
             * Authorize operator
             * Revoke operator
             */

            beforeEach(async()=>{

                await tanglSecurityToken.authorizeOperatorByPartition(classA.hex, tanglAdministrator2, {from: investor_Dami})

            })

            it("approves operation for a partition", async()=>{

                const isOperatorForPartition = await tanglSecurityToken.isOperatorForPartition(classA.hex, tanglAdministrator2, investor_Dami)
                isOperatorForPartition.should.be.equal(true, "operator was approved by token holder to the partition")

            })

            it("revokes operator", async()=>{

                const revokeOperatorByPartition = await tanglSecurityToken.revokeOperatorByPartition(classA.hex, tanglAdministrator2, {from:investor_Dami})
                const isOperatorForPartition = await tanglSecurityToken.isOperatorForPartition(classA.hex, tanglAdministrator2, investor_Dami)

                isOperatorForPartition.should.be.equal(false, "operator was revoked by token holder to the partition")
                revokeOperatorByPartition.logs[0].event.should.be.equal("RevokedOperatorByPartition", "it emits the revoked operator by partition event")
                web3.utils.hexToUtf8(revokeOperatorByPartition.logs[0].args._partition).should.be.equal("CLASS A", "it emits the partition where the operator was revoked")
                revokeOperatorByPartition.logs[0].args._operator.should.be.equal(tanglAdministrator2, "it emits the revoked operator's address")
                revokeOperatorByPartition.logs[0].args._tokenHolder.should.be.equal(investor_Dami, "it emits the token holder's address")

            })

        })


    })


    describe("operator transfer", ()=>{

        beforeEach(async()=>{

            let issuanceCert1 = await certificate(tanglAdministratorData, investorDamiData, 5, 1, tanglDomainData, tanglAdministratorPrivkey)
            let issuanceCert2 = await certificate(tanglAdministratorData, investorDamiData, 5, 2, tanglDomainData, tanglAdministratorPrivkey)

            await tanglSecurityToken.issueByPartition(classA.hex, investor_Dami, 5, issuanceCert1, {from: tanglAdministrator})  // issue tokens to an holder's partiton
            await tanglSecurityToken.issueByPartition(classB.hex, investor_Dami, 5, issuanceCert2, {from: tanglAdministrator})  // issue tokens to an holder's partiton


        })


        describe("operator transfer due to authorizing for specific partitions", ()=>{

            describe("successful operator transfer", ()=>{

                let operatorTransferByPartition
    
    
                beforeEach(async()=>{

                    let transferCert = await certificate(investorDamiData, investorJeffData, BigInt(tokens(2)), 1, tanglDomainData, tanglAdministratorPrivkey)
                    await tanglSecurityToken.authorizeOperatorByPartition(classA.hex, tanglAdministrator2, {from: investor_Dami})

    
                    operatorTransferByPartition = await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Dami, investor_Jeff, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator2})
                
                })
    
                it("emits the transfer by partition event", ()=>{
    
                    operatorTransferByPartition.logs[0].event.should.be.equal("Transfer", "it emits the transfer event")
                    operatorTransferByPartition.logs[1].event.should.be.equal("TransferByPartition", "it emits the transfer by partition event")
                    
                    //  Transfer event test
                    operatorTransferByPartition.logs[0].args._from.should.be.equal(investor_Dami, "it emits the `from` account")
                    operatorTransferByPartition.logs[0].args._to.should.be.equal(investor_Jeff, "it emits the `to` account")
                    Number(operatorTransferByPartition.logs[0].args._value).should.be.equal(Number(tokens(2)), "it emits the amount sent")
    
    
                    //  TransferByPartition event test
                    operatorTransferByPartition.logs[1].args._from.should.be.equal(investor_Dami, "it emits the `from` account")
                    operatorTransferByPartition.logs[1].args._to.should.be.equal(investor_Jeff, "it emits the `to` account")
                    Number(operatorTransferByPartition.logs[1].args._value).should.be.equal(Number(tokens(2)), "it emits the amount sent")
                    operatorTransferByPartition.logs[1].args._operator.should.be.equal(tanglAdministrator2, "it emits the operator's address")
                    web3.utils.hexToUtf8(operatorTransferByPartition.logs[1].args._fromPartition).should.be.equal("CLASS A", "it emits the partition sent")
    
    
                })
    
                it("updates the balances of the `from` and `to` accounts", async()=>{
    
                    const fromBalanceAcrossAllPartitions = await tanglSecurityToken.balanceOf(investor_Dami)
                    const toBalanceAcrossAllPartitions = await tanglSecurityToken.balanceOf(investor_Jeff)
    
    
                    const fromPartitionBalance = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Dami)
                    const toPartitionBalance = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Jeff)
    
                    Number(fromBalanceAcrossAllPartitions).should.be.equal(Number(tokens(8)), "it updates the total balance of the `from` account")
                    Number(fromPartitionBalance).should.be.equal(Number(tokens(3)), "it updates the partition balance of the `from` account")
                
                    Number(toBalanceAcrossAllPartitions).should.be.equal(Number(tokens(2)), "it updates the total balance of the `to` account")
                    Number(toPartitionBalance).should.be.equal(Number(tokens(2)), "it updates the partition balance of the `to` account")
                })
    
    
            })
    
    
            describe("unsuccessful operator transfers", ()=>{
    
                let transferCert
    
                beforeEach(async()=>{
    
                    await tanglSecurityToken.authorizeOperatorByPartition(classA.hex, tanglAdministrator2, {from: investor_Dami})

                    transferCert = await certificate(investorDamiData, investorJeffData, BigInt(tokens(2)), 1, tanglDomainData, tanglAdministratorPrivkey)
    
                })
    
                it("fails to transfer by an unauthorized operator", async()=>{
    
                    await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Dami, investor_Jeff, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator}).should.be.rejectedWith(reverts.RESTRICTED)
    
                })
    
    
                it("fails to transfer by a revoked operator", async()=>{
    
                    await tanglSecurityToken.revokeOperatorByPartition(classA.hex, tanglAdministrator2, {from:investor_Dami})
                    await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Dami, investor_Jeff, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator2}).should.be.rejectedWith(reverts.RESTRICTED)
    
                })
    
    
                it("fails to transfer due to insufficient balance", async()=>{
    
                    await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Dami, investor_Jeff, tokens(6), transferCert, stringToHex("").hex, {from: tanglAdministrator2}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)
    
                })
    
    
                it("fails to transfer ether address", async()=>{
    
                    await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Dami, ETHER_ADDRESS, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator2}).should.be.rejectedWith(reverts.INVALID_RECEIVER)
    
                })
    
    
                it("limits the operator to the authorized partition", async()=>{
    
                    await tanglSecurityToken.operatorTransferByPartition(classB.hex, investor_Dami, investor_Jeff, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator2}).should.be.rejectedWith(reverts.RESTRICTED)
    
                })
    
            })

        })


        describe("operator transfer due to authorizing across all partitions", ()=>{

            beforeEach(async()=>{

                await tanglSecurityToken.authorizeOperator(tanglAdministrator3, {from: investor_Dami})
            
            })

            describe("successful operator transfer", ()=>{

                let operatorTransferByClassA
                let operatorTransferByClassB

                beforeEach(async()=>{

                    let transferCert1 = await certificate(investorDamiData, investorJeffData, BigInt(tokens(2)), 1, tanglDomainData, tanglAdministratorPrivkey)
                    let transferCert2 = await certificate(investorDamiData, investorJeffData, BigInt(tokens(2)), 2, tanglDomainData, tanglAdministratorPrivkey)
    
                    operatorTransferByClassA = await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Dami, investor_Jeff, tokens(2), transferCert1, stringToHex("").hex, {from: tanglAdministrator3})
                    operatorTransferByClassB = await tanglSecurityToken.operatorTransferByPartition(classB.hex, investor_Dami, investor_Jeff, tokens(2), transferCert2, stringToHex("").hex, {from: tanglAdministrator3})
                    
                })
                
                it("emits the transfer by partition event", ()=>{
    
                    operatorTransferByClassA.logs[0].event.should.be.equal("Transfer", "it emits the transfer event")
                    operatorTransferByClassA.logs[1].event.should.be.equal("TransferByPartition", "it emits the transfer by partition event")
                    
                    //  Transfer event test
                    operatorTransferByClassA.logs[0].args._from.should.be.equal(investor_Dami, "it emits the `from` account")
                    operatorTransferByClassA.logs[0].args._to.should.be.equal(investor_Jeff, "it emits the `to` account")
                    Number(operatorTransferByClassA.logs[0].args._value).should.be.equal(Number(tokens(2)), "it emits the amount sent")
    
    
                    //  TransferByPartition event test
                    operatorTransferByClassA.logs[1].args._from.should.be.equal(investor_Dami, "it emits the `from` account")
                    operatorTransferByClassA.logs[1].args._to.should.be.equal(investor_Jeff, "it emits the `to` account")
                    Number(operatorTransferByClassA.logs[1].args._value).should.be.equal(Number(tokens(2)), "it emits the amount sent")
                    operatorTransferByClassA.logs[1].args._operator.should.be.equal(tanglAdministrator3, "it emits the operator's address")
                    web3.utils.hexToUtf8(operatorTransferByClassA.logs[1].args._fromPartition).should.be.equal("CLASS A", "it emits the partition sent")
    
    
                })


                it("emits the transfer by partition event", ()=>{
    
                    operatorTransferByClassB.logs[0].event.should.be.equal("Transfer", "it emits the transfer event")
                    operatorTransferByClassB.logs[1].event.should.be.equal("TransferByPartition", "it emits the transfer by partition event")
                    
                    //  Transfer event test
                    operatorTransferByClassB.logs[0].args._from.should.be.equal(investor_Dami, "it emits the `from` account")
                    operatorTransferByClassB.logs[0].args._to.should.be.equal(investor_Jeff, "it emits the `to` account")
                    Number(operatorTransferByClassB.logs[0].args._value).should.be.equal(Number(tokens(2)), "it emits the amount sent")
    
    
                    //  TransferByPartition event test
                    operatorTransferByClassB.logs[1].args._from.should.be.equal(investor_Dami, "it emits the `from` account")
                    operatorTransferByClassB.logs[1].args._to.should.be.equal(investor_Jeff, "it emits the `to` account")
                    Number(operatorTransferByClassB.logs[1].args._value).should.be.equal(Number(tokens(2)), "it emits the amount sent")
                    operatorTransferByClassB.logs[1].args._operator.should.be.equal(tanglAdministrator3, "it emits the operator's address")
                    web3.utils.hexToUtf8(operatorTransferByClassB.logs[1].args._fromPartition).should.be.equal("CLASS B", "it emits the partition sent")
    
    
                })
    
                it("updates the balances of the `from` and `to` accounts", async()=>{
    
                    const fromBalanceAcrossAllPartitions = await tanglSecurityToken.balanceOf(investor_Dami)
                    const toBalanceAcrossAllPartitions = await tanglSecurityToken.balanceOf(investor_Jeff)
    
    
                    const fromPartitionA_Balance = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Dami)
                    const fromPartitionB_Balance = await tanglSecurityToken.balanceOfByPartition(classB.hex, investor_Dami)
                    
                    const toPartitionA_Balance = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Jeff)
                    const toPartitionB_Balance = await tanglSecurityToken.balanceOfByPartition(classB.hex, investor_Jeff)
                    
                    Number(fromBalanceAcrossAllPartitions).should.be.equal(Number(tokens(6)), "it updates the total balance of the `from` account")
                    Number(fromPartitionA_Balance).should.be.equal(Number(tokens(3)), "it updates the partition balance of the `from` account")
                    Number(fromPartitionB_Balance).should.be.equal(Number(tokens(3)), "it updates the partition balance of the `from` account")
                    
                    Number(toBalanceAcrossAllPartitions).should.be.equal(Number(tokens(4)), "it updates the total balance of the `to` account")
                    Number(toPartitionA_Balance).should.be.equal(Number(tokens(2)), "it updates the partition balance of the `to` account")
                    Number(toPartitionB_Balance).should.be.equal(Number(tokens(2)), "it updates the partition balance of the `to` account")
                    
                })
    

            })


            describe("unsuccessful operator transfer", ()=>{

                let transferCert
    
                beforeEach(async()=>{
    

                    transferCert = await certificate(investorDamiData, investorJeffData, BigInt(tokens(2)), 1, tanglDomainData, tanglAdministratorPrivkey)
    
                })

                it("fails to transfer by an unauthorized operator", async()=>{
    
                    await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Dami, investor_Jeff, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator}).should.be.rejectedWith(reverts.RESTRICTED)
    
                })
    
    
                it("fails to transfer by a revoked operator", async()=>{
    
                    await tanglSecurityToken.revokeOperator(tanglAdministrator3, {from:investor_Dami})
                    await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Dami, investor_Jeff, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator3}).should.be.rejectedWith(reverts.RESTRICTED)
    
                })
    
    
                it("fails to transfer due to insufficient balance", async()=>{
    
                    await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Dami, investor_Jeff, tokens(6), transferCert, stringToHex("").hex, {from: tanglAdministrator3}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)
                    await tanglSecurityToken.operatorTransferByPartition(classB.hex, investor_Dami, investor_Jeff, tokens(6), transferCert, stringToHex("").hex, {from: tanglAdministrator3}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)
                    
                })
    
    
                it("fails to transfer ether address", async()=>{
    
                    await tanglSecurityToken.operatorTransferByPartition(classA.hex, investor_Dami, ETHER_ADDRESS, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator3}).should.be.rejectedWith(reverts.INVALID_RECEIVER)
    
                })
    
    
                it("limits the operator to the authorized partition", async()=>{
    
                    const transferCert = await certificate(investorJeffData, investorDamiData, BigInt(tokens(2)), 1, tanglDomainData, tanglAdministratorPrivkey)

                    await tanglSecurityToken.operatorTransferByPartition(classB.hex, investor_Jeff, investor_Dami, tokens(2), transferCert, stringToHex("").hex, {from: tanglAdministrator3}).should.be.rejectedWith(reverts.RESTRICTED)
    
                })

            })

        })

        

    })


    describe("operator redeem", ()=>{


        //  isssue by partition to A and B
        //  test total supply and balances
        //  approve operator by partition
        //  operator redeem by partition
        //  test success and failed cases
        //  approve operator across all partitions
        //  operator can redeem across all partitions
        //  test failed cases

        let redemptionCert1
        let redemptionCert2

        beforeEach(async()=>{

            let issuanceCert1 = await certificate(tanglAdministratorData, investorDamiData, 5, 1, tanglDomainData, tanglAdministratorPrivkey)
            let issuanceCert2 = await certificate(tanglAdministratorData, investorDamiData, 5, 2, tanglDomainData, tanglAdministratorPrivkey)

            await tanglSecurityToken.issueByPartition(classA.hex, investor_Dami, 5, issuanceCert1, {from: tanglAdministrator})  // issue tokens to an holder's partiton
            await tanglSecurityToken.issueByPartition(classB.hex, investor_Dami, 5, issuanceCert2, {from: tanglAdministrator})  // issue tokens to an holder's partiton
            
            redemptionCert1 = await certificate(investorDamiData, redemptionData, BigInt(tokens(2)), 7, tanglDomainData, tanglAdministratorPrivkey)
            redemptionCert2 = await certificate(investorDamiData, redemptionData, BigInt(tokens(2)), 8, tanglDomainData, tanglAdministratorPrivkey)

        })


        describe("operator redeems due to authorizing for specific partitions", ()=>{

            beforeEach(async()=>{
                await tanglSecurityToken.authorizeOperatorByPartition(classA.hex, tanglAdministrator2, {from: investor_Dami})
            })


            describe("successful redemption", ()=>{

                it("updates the total supply after issuance", async()=>{
                    const totalSupply = await tanglSecurityToken.totalSupply()
                    Number(totalSupply).should.be.equal(Number(tokens(10)), "it updates the total supply after issuance")
                })

                it("redeems the token by the authorized operator", async()=>{
                    const operatorRedeemByPartition = await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Dami, tokens(2), redemptionCert1, {from: tanglAdministrator2})
                
                    // test the RedeemedByPartition event

                    operatorRedeemByPartition.logs[0].event.should.be.equal("RedeemedByPartition", "it emits the redeemed by partition event")
                    operatorRedeemByPartition.logs[0].args._operator.should.be.equal(tanglAdministrator2, "it emit the operator of the token redemption")
                    operatorRedeemByPartition.logs[0].args._from.should.be.equal(investor_Dami, "it emit the token holder")
                    web3.utils.hexToUtf8(operatorRedeemByPartition.logs[0].args._partition).should.be.equal("CLASS A", "it emit the redeemed partition")
                    Number(operatorRedeemByPartition.logs[0].args._value).should.be.equal(Number(tokens(2)), "it emit the amount redeemed")
                    

                    // test the total supply after redemption

                    const totalSupply = await tanglSecurityToken.totalSupply()
                    Number(totalSupply).should.be.equal(Number(tokens(8)), "it updates the total supply after redemption")

                    //  test the holder's balances
                    const totalBalance = await tanglSecurityToken.balanceOf(investor_Dami)
                    const balanceOfByPartition = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Dami)

                    Number(totalBalance).should.be.equal(Number(tokens(8)), "it updates the total balance of the holder after redemption")
                    Number(balanceOfByPartition).should.be.equal(Number(tokens(3)), "it updates the redeemed partition balance after redemption")

                })

            })


            describe("failed redemption", ()=>{

                it("fails to redeem by an unauthorized address", async()=>{

                    await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Dami, tokens(2), redemptionCert1, {from: tanglAdministrator}).should.be.rejectedWith(reverts.RESTRICTED)

                })

                it("fails to redeem by a revoked operator", async()=>{

                    await tanglSecurityToken.revokeOperatorByPartition(classA.hex, tanglAdministrator2, {from :investor_Dami})
                    await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Dami, tokens(2), redemptionCert1, {from: tanglAdministrator2}).should.be.rejectedWith(reverts.RESTRICTED)

                })


                it("fails to redeem by an due to insufficient amount", async()=>{

                    redemptionCert1 = await certificate(investorDamiData, redemptionData, BigInt(tokens(12)), 7, tanglDomainData, tanglAdministratorPrivkey)
                    await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Dami, tokens(12), redemptionCert1, {from: tanglAdministrator2}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)


                })


                it("fails to redeem with a used signature", async()=>{

                    await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Dami, tokens(2), redemptionCert1, {from: tanglAdministrator2})
                    
                    //  attempt to reuse the signature for a replay attack

                    await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Dami, tokens(2), redemptionCert1, {from: tanglAdministrator2}).should.be.rejectedWith(reverts.USED_SIGNATURE)

                })

                it("limits the operator to approved partitions only", async()=>{

                    await tanglSecurityToken.operatorRedeemByPartition(classB.hex, investor_Dami, tokens(2), redemptionCert1, {from: tanglAdministrator2}).should.be.rejectedWith(reverts.RESTRICTED)

                })

            })

        })


        describe("operator redeems due to authorizing across all partitions", ()=>{

            beforeEach(async()=>{

                await tanglSecurityToken.authorizeOperator(tanglAdministrator3, {from: investor_Dami})
            
            })

            describe("successful redemption", ()=>{

                let operatorRedeemByClassA
                let operatorRedeemByClassB

                beforeEach(async()=>{

                    operatorRedeemByClassA = await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Dami, tokens(2), redemptionCert1, {from: tanglAdministrator3})
                    operatorRedeemByClassB = await tanglSecurityToken.operatorRedeemByPartition(classB.hex, investor_Dami, tokens(2), redemptionCert2, {from: tanglAdministrator3})

                })

                it("emits the event and event data", async()=>{

                    //  event for class A

                    operatorRedeemByClassA.logs[0].event.should.be.equal("RedeemedByPartition", "it emits the redeemed by partition event")
                    operatorRedeemByClassA.logs[0].args._operator.should.be.equal(tanglAdministrator3, "it emit the operator of the token redemption")
                    operatorRedeemByClassA.logs[0].args._from.should.be.equal(investor_Dami, "it emit the token holder")
                    web3.utils.hexToUtf8(operatorRedeemByClassA.logs[0].args._partition).should.be.equal("CLASS A", "it emit the redeemed partition")
                    Number(operatorRedeemByClassA.logs[0].args._value).should.be.equal(Number(tokens(2)), "it emit the amount redeemed")

                    //  event for class B

                    operatorRedeemByClassB.logs[0].event.should.be.equal("RedeemedByPartition", "it emits the redeemed by partition event")
                    operatorRedeemByClassB.logs[0].args._operator.should.be.equal(tanglAdministrator3, "it emit the operator of the token redemption")
                    operatorRedeemByClassB.logs[0].args._from.should.be.equal(investor_Dami, "it emit the token holder")
                    web3.utils.hexToUtf8(operatorRedeemByClassB.logs[0].args._partition).should.be.equal("CLASS B", "it emit the redeemed partition")
                    Number(operatorRedeemByClassB.logs[0].args._value).should.be.equal(Number(tokens(2)), "it emit the amount redeemed")

                })

                it("updates the total supply and holder's balances", async()=>{
                    // test the total supply after redemption

                    const totalSupply = await tanglSecurityToken.totalSupply()
                    Number(totalSupply).should.be.equal(Number(tokens(6)), "it updates the total supply after redemption")

                    //  test the holder's balances
                    const totalBalance = await tanglSecurityToken.balanceOf(investor_Dami)
                    const balanceOfByPartitionA = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Dami)
                    const balanceOfByPartitionB = await tanglSecurityToken.balanceOfByPartition(classB.hex, investor_Dami)

                    Number(totalBalance).should.be.equal(Number(tokens(6)), "it updates the total balance of the holder after redemption")
                    Number(balanceOfByPartitionA).should.be.equal(Number(tokens(3)), "it updates the redeemed partition balance after redemption")
                    Number(balanceOfByPartitionB).should.be.equal(Number(tokens(3)), "it updates the redeemed partition balance after redemption")
                    
                })

            })


            describe("unsuccessful redemption", ()=>{

                it("fails to redeem by an unauthorized address", async()=>{

                    await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Dami, tokens(2), redemptionCert1, {from: tanglAdministrator2}).should.be.rejectedWith(reverts.RESTRICTED)


                })

                it("fails to redeem by a revoked operator", async()=>{

                    await tanglSecurityToken.revokeOperator(tanglAdministrator3, {from: investor_Dami})
                    await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Dami, tokens(2), redemptionCert1, {from: tanglAdministrator3}).should.be.rejectedWith(reverts.RESTRICTED)
                    
                })


                it("fails to redeem due to insufficient balance", async()=>{

                    redemptionCert1 = await certificate(investorDamiData, redemptionData, BigInt(tokens(12)), 7, tanglDomainData, tanglAdministratorPrivkey)
                    await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Dami, tokens(12), redemptionCert1, {from: tanglAdministrator3}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)
                    
                })


                it("fails to redeem with a used signature", async()=>{

                    await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Dami, tokens(2), redemptionCert1, {from: tanglAdministrator3})
                    await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Dami, tokens(2), redemptionCert1, {from: tanglAdministrator3}).should.be.rejectedWith(reverts.USED_SIGNATURE)
                    
                })

                it("limits the operator to holders' it is approved by", async()=>{

                    redemptionCert1 = await certificate(investorJeffData, redemptionData, BigInt(tokens(2)), 7, tanglDomainData, tanglAdministratorPrivkey)
                    await tanglSecurityToken.operatorRedeemByPartition(classA.hex, investor_Jeff, tokens(2), redemptionCert1, {from: tanglAdministrator3}).should.be.rejectedWith(reverts.RESTRICTED)

                })
                
            })

        })
        
    })

    
    

})