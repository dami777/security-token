
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

    /*describe("partitions of a token holder", ()=>{

        it("returns an array of the initialized partitions", async()=>{

            const partitions = await erc1400.totalPartitions()
            partitions.should.not.be.equal([], "the partition is not empty")
        
        })

        it("returns a zero balance in share class A for issuer", async()=>{
            const balance = await erc1400.balanceOfByPartition(classA, issuer)
            balance.toString().should.be.equal("0", "issuer has 0 balance in class A")
        }) 

    })

    describe("partition balance of an holder", ()=>{

        beforeEach(async()=>{

            // issuer classA and classB to investor1
            await erc1400.issueByPartition(classA, investor1, 5, web3.utils.toHex(""))
            await erc1400.issueByPartition(classB, investor1, 5, web3.utils.toHex(""))
            
            // issue classB to investor2
            await erc1400.issueByPartition(classB, investor2, 5, web3.utils.toHex(""))

        })

        it("outputs the partitions being held by an investor", async()=>{
            const partitionsOfinvestor1 = await erc1400.partitionsOf(investor1)
            partitionsOfinvestor1.length.toString().should.be.equal("2", "it returns the partitions in the investor's wallet")

            const partitionsOfinvestor2 = await erc1400.partitionsOf(investor2)

            //  It returns length of 2 instead of 1; which are  bytes0 and the partition he is holding
            partitionsOfinvestor2.length.toString().should.be.equal("2", "it returns the partitions in the investor's wallet")
            
        })

    })

    describe ("issuance of token by partition", ()=>{

        let issueClassA

        beforeEach(async()=>{

            issueClassA = await erc1400.issueByPartition(classA, investor1, 5, web3.utils.toHex(""))
            
        })

        describe("issuance of class A tokens", ()=>{

            it("updates the global balance of the token holder", async()=>{
                const investor1TotalBalance = await erc1400.balanceOf(investor1)
                investor1TotalBalance.toString().should.be.equal(tokens(5).toString(), "total balance increased")
            })

            it("updates the balance of the token holder in class A", async()=>{
                const classAbalance = await erc1400.balanceOfByPartition(classA, investor1)
                classAbalance.toString().should.be.equal(tokens(5).toString(), "it updates the class A token balance of the holder")
            })

            it("doesn't affect balance in other partitions", async()=>{
                const classBbalance = await erc1400.balanceOfByPartition(classB, investor1)
                classBbalance.toString().should.be.equal(tokens(0).toString(), "issuance to class A doesn't affect class B balance")
            })

        })

        describe("issuance of class B tokens", ()=>{

            beforeEach(async()=>{

                issueClassB = await erc1400.issueByPartition(classB, investor1, 10, web3.utils.toHex(""))

            })

           it("updates the global balance of the token holder", async()=>{
                const investor1TotalBalance = await erc1400.balanceOf(investor1)
                investor1TotalBalance.toString().should.be.equal(tokens(15).toString(), "the global balance of the token holder increases after being issued class B tokens")
           })

           it("updates class B balance of the holder", async()=>{
                const classBbalance = await erc1400.balanceOfByPartition(classB, investor1)
                classBbalance.toString().should.be.equal(tokens(10).toString(), "it updates the class B balance of the holder")
           })

           it("doesn't affect the balance in other partitions", async()=>{
                const classAbalance = await erc1400.balanceOfByPartition(classA, investor1)
                classAbalance.toString().should.be.equal(tokens(5).toString(), "class B issuance doen't affect class A balance") 
           })

        })

        

    })

    describe("tokens transfer from partitons", ()=>{


        let issueClassA
        
        beforeEach(async()=>{
            issueClassA = await erc1400.issueByPartition(classA, investor1, 5, web3.utils.toHex(""))
            await erc1400.setController(signer)
        })

        describe("successful transfer", ()=>{

            let classAtokenTransfer

            beforeEach(async()=>{
                classAtokenTransfer = await erc1400.transferByPartition(classA, investor2, tokens(2), data, {from: investor1})
            })

           it("transfers tokens in class A from address 2 to investor2", async()=>{
               
                const investor1ClassABalance = await erc1400.balanceOfByPartition(classA, investor1)
                investor1ClassABalance.toString().should.be.equal(tokens(3).toString(), "class A balance of sender reduced accordingly")

                const investor2ClassABalance = await erc1400.balanceOfByPartition(classA, investor2)
                investor2ClassABalance.toString().should.be.equal(tokens(2).toString(), "class A balance of token receiver increases as expected")


            })

            it("reflects in the global balance of the sender and receiver", async()=>{
                const investor1GlobalBalance = await erc1400.balanceOf(investor1)
                investor1GlobalBalance.toString().should.be.equal(tokens(3).toString(), "the global balance of the sender updates after transfer")

                const investor2GlobalBalance = await erc1400.balanceOf(investor2)
                investor2GlobalBalance.toString().should.be.equal(tokens(2).toString(), "the global balance of the receiver updates after transfer")
            })

            it("emits events", async()=>{
                classAtokenTransfer.logs[0].event.should.be.equal("TransferByPartition", "it emits the transfer by partition event")
                classAtokenTransfer.logs[1].event.should.be.equal("Transfer", "it emits the transfer event")
                
            })

        })

        describe("failed transfer", ()=>{

            it("failed to transfer tokens to ether address", async()=>{
                await erc1400.transferByPartition(classA, ETHER_ADDRESS, tokens(2), data, {from: investor1}).should.be.rejected
            })

            it("failed due to insufficient tokens", async()=>[
                await erc1400.transferByPartition(classB, investor2, tokens(2), data, {from: investor1}).should.be.rejected
            ])


        })

    })*/

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


        describe("operator transfer due to authorizing across all paritions", ()=>{

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

    /*describe("operator's operations on assets", ()=>{

        beforeEach(async()=>{
            
            await erc1400.setController(signer)
        })

        // issuance variable for investor1

        let issueClassAToAdddress2
        let issueClassBToAdddress2

        // issuance variable for investor2

        let issueClassAToAdddress3
        let issueClassBToAdddress3

        beforeEach(async()=>{
            issueClassAToAdddress2 = await erc1400.issueByPartition(classA, investor1, 20, web3.utils.toHex(""))    //issue class A tokens to investor1
            issueClassBToAdddress2 = await erc1400.issueByPartition(classB, investor1, 20, web3.utils.toHex(""))    //issue class A tokens to investor1


            issueClassAToAdddress3 = await erc1400.issueByPartition(classA, investor2, 20, web3.utils.toHex(""))    //issue class A tokens to investor2
            issueClassBToAdddress3 = await erc1400.issueByPartition(classB, investor2, 20, web3.utils.toHex(""))    //issue class A tokens to investor2


            // authorize operator1 accross all partitions

            await erc1400.authorizeOperator(operator1, {from: investor1})
            await erc1400.authorizeOperator(operator1, {from: investor2})



            // authorize operator2 accross specific partitions

            await erc1400.authorizeOperatorByPartition(classA, operator2, {from: investor1}) // authorize operator2 to class A
            await erc1400.authorizeOperatorByPartition(classB, operator2, {from: investor2}) // authorize operator2 to class B



        })

        it("issued tokens to address 2 and 3", async()=>{
            const investor1Balance = await erc1400.balanceOf(investor1)
            investor1Balance.toString().should.be.equal(tokens(40).toString(), "new tokens were issued to investor1")

            const investor2Balance = await erc1400.balanceOf(investor2)
            investor2Balance.toString().should.be.equal(tokens(40).toString(), "new tokens were issued to investor2")
        })

        describe("operator 1 transfer activities", ()=>{

            it("transfers tokens from investor1's class A tokens to other addresses", async()=>{


                const transfer = await erc1400.operatorTransferByPartition(classA, investor1, investor3, tokens(5), web3.utils.toHex(""), data, {from: operator1})

                const investor1Balance = await erc1400.balanceOfByPartition(classA, investor1)
                const investor3Balance = await erc1400.balanceOfByPartition(classA, investor3)

                investor1Balance.toString().should.be.equal(tokens(15).toString(), "operator sent tokens from this account")
                investor3Balance.toString().should.be.equal(tokens(5).toString(), "operator sent tokens from an account to this account")
                
                transfer.logs[0].event.should.be.equal("TransferByPartition", "it emits the transfer by partition event")
                transfer.logs[1].event.should.be.equal("Transfer", "it emits the transfer event")

            })


            it("transfers tokens from investor1's class B tokens to other addresses", async()=>{


                const transfer = await erc1400.operatorTransferByPartition(classB, investor1, investor4, tokens(10), web3.utils.toHex(""), data, {from: operator1})

                const investor1Balance = await erc1400.balanceOfByPartition(classB, investor1)
                const investor4Balance = await erc1400.balanceOfByPartition(classB, investor4)

                investor1Balance.toString().should.be.equal(tokens(10).toString(), "operator sent tokens from this account")
                investor4Balance.toString().should.be.equal(tokens(10).toString(), "operator sent tokens from an account to this account")

            })

            it("fails to transfer tokens from the specified partition due to holder's insufficient token in that partition", async()=>{
                await erc1400.operatorTransferByPartition(classB, investor1, investor4, tokens(40), web3.utils.toHex(""), data, {from: operator1}).should.be.rejected
            })

        })

        describe("operator 2 transfer activities", ()=>{

            it("transfers tokens from the class A partition it has been given to", async()=>{

                const transfer = await erc1400.operatorTransferByPartition(classA, investor1, investor4, tokens(20), web3.utils.toHex(""), data, {from: operator2})

                const investor1Balance = await erc1400.balanceOfByPartition(classA, investor1)
                const investor4Balance = await erc1400.balanceOfByPartition(classA, investor4)

                investor1Balance.toString().should.be.equal(tokens(0).toString(), "operator sent tokens from this account")
                investor4Balance.toString().should.be.equal(tokens(20).toString(), "operator sent tokens from an account to this account")


            })


            it("transfers tokens from class B partition it has been given access to", async()=>{

                const transfer = await erc1400.operatorTransferByPartition(classB, investor2, investor3, tokens(10), web3.utils.toHex(""), data, {from: operator2})

                const investor2Balance = await erc1400.balanceOfByPartition(classB, investor2)
                const investor3Balance = await erc1400.balanceOfByPartition(classB, investor3)

                investor2Balance.toString().should.be.equal(tokens(10).toString(), "operator sent tokens from this account")
                investor3Balance.toString().should.be.equal(tokens(10).toString(), "operator sent tokens from an account to this account")

            })

            it("rejects an operator's transfer operation from partitions it has no access to", async()=>{
                await erc1400.operatorTransferByPartition(classB, investor1, investor4, tokens(10), web3.utils.toHex(""), web3.utils.toHex(""), {from: operator2}).should.be.rejected
                await erc1400.operatorTransferByPartition(classA, investor2, investor4, tokens(10), web3.utils.toHex(""), web3.utils.toHex(""), {from: operator2}).should.be.rejected
            })

        })

    



    })

    describe("redemption by partitition", ()=>{

        let issueClassAToAdddress2
        let issueClassBToAdddress2

        beforeEach(async()=>{

            issueClassAToAdddress2 = await erc1400.issueByPartition(classA, investor1, 20, web3.utils.toHex(""))    //issue class A tokens to investor1
            issueClassBToAdddress2 = await erc1400.issueByPartition(classB, investor1, 20, web3.utils.toHex(""))    //issue class A tokens to investor1

            // authorize operator 1 to all partitions

            await erc1400.authorizeOperator(operator1, {from: investor1})
            

            // authorize operator2 to specific partitions

            await erc1400.authorizeOperatorByPartition(classA, operator2, {from: investor1}) // authorize operator2 to class A only
           
            await erc1400.setController(signer)  // add signer to the controllers
        })

        it("issued tokens to investor1", async()=>{
            const balance = await erc1400.balanceOf(investor1)
            balance.toString().should.be.equal(tokens(40).toString(), "tokens were issued to address 2")
        })

        it("updated the total supply", async()=>{
            const totalSupply = await erc1400.totalSupply()
            totalSupply.toString().should.be.equal(tokens(40).toString(), "total supply was updated")

        })


        describe("holder burnt his tokens in a partition", ()=>{

            let tokenBurn

            beforeEach(async()=>{

                tokenBurn = await erc1400.redeemByPartition(classA, tokens(1), data, {from: investor1})

            })

            it("burnt tokens successfully", async()=>{

                const balanceOfByPartition = await erc1400.balanceOfByPartition(classA, investor1)
                balanceOfByPartition.toString().should.be.equal(tokens(19).toString(), "tokens reduced in the specific partition of the token holder after burning")

                const balance = await erc1400.balanceOf(investor1)
                balance.toString().should.be.equal(tokens(39).toString(), "total balance of the holder reduced after burning tokens in a partition")

            })

            it("reduced the total supply across all partitions after burning tokens", async()=>{
                const totalSupply = await erc1400.totalSupply()
                totalSupply.toString().should.be.equal(tokens(39).toString(), "total supply accross all partitions reduces after holder burnt tokens")
            })

            it("emits the redeem by partition event after an holder burnt his tokens", async()=>{

                tokenBurn.logs[0].event.should.be.equal("RedeemedByPartition", "it emits the redeemed by partition event")
                //tokenBurn.logs[0].args._partition.should.be.equal(classA, "the partition data emitted checks")
                tokenBurn.logs[0].args._operator.should.be.equal(investor1, "the operator address checks")
                tokenBurn.logs[0].args._from.should.be.equal(investor1, "the address from which tokens were burnt checks")
                tokenBurn.logs[0].args._amount.toString().should.be.equal(tokens(1).toString(), "the amount of tokens burnt checks")
                

            })

            it("failed to burn tokens from partitions with insufficient tokens to burn", async()=>{
                await erc1400.redeemByPartition(classB, tokens(31), data, {from: investor1}).should.be.rejected
            })

        })

        describe("operator burns an holder's token", ()=>{

            let operator1Burn
            let operator2Burn

            

            describe("operator 1 burns token", ()=>{

                beforeEach(async()=>{
                    operator1Burn = await erc1400.operatorRedeemByPartition(classB, investor1, tokens(5), data, {from: operator1})
                })

                it("reduces the total supply", async()=>{
                    const totalSupply = await erc1400.totalSupply()
                    totalSupply.toString().should.be.equal(tokens(35).toString(), "total supply reduces after operator burns tokens from an holder's partition")
                })

                it("reduces the balance of the holder", async()=>{
                    const balanceOfByPartition = await erc1400.balanceOfByPartition(classB, investor1)
                    balanceOfByPartition.toString().should.be.equal(tokens(15).toString(), "tokens reduced in the specific partition of the token holder after burning")

                    const balance = await erc1400.balanceOf(investor1)
                    balance.toString().should.be.equal(tokens(35).toString(), "total balance of the holder reduced after burning tokens in a partition")
                })

                it("emits redeemed by partition event", async()=>{
                    operator1Burn.logs[0].event.should.be.equal("RedeemedByPartition", "it emits the redeemed by partition after an operator burns tokens from an holder's partition")
                    operator1Burn.logs[0].args._operator.should.be.equal(operator1, "emits the operator's address")
                    operator1Burn.logs[0].args._from.should.be.equal(investor1, "it emits the holder's address")
                    operator1Burn.logs[0].args._amount.toString().should.be.equal(tokens(5).toString(), "it emits the amount of tokens burnt")
                    operator1Burn.logs[0].args._operatorData.should.be.equal(data, "it emits the signature")
                })

            })

            describe("operator 2 burns token", ()=>{

                beforeEach(async()=>{
                    operator2Burn = await erc1400.operatorRedeemByPartition(classA, investor1, tokens(5), data, {from: operator2})
                })


                it("reduces the total supply", async()=>{
                    const totalSupply = await erc1400.totalSupply()
                    totalSupply.toString().should.be.equal(tokens(35).toString(), "total supply reduces after operator burns tokens from an holder's partition")
                })

                it("reduces the balance of the holder", async()=>{
                    const balanceOfByPartition = await erc1400.balanceOfByPartition(classA, investor1)
                    balanceOfByPartition.toString().should.be.equal(tokens(15).toString(), "tokens reduced in the specific partition of the token holder after burning")

                    const balance = await erc1400.balanceOf(investor1)
                    balance.toString().should.be.equal(tokens(35).toString(), "total balance of the holder reduced after burning tokens in a partition")
                })

                it("emits redeemed by partition event", async()=>{
                    operator2Burn.logs[0].event.should.be.equal("RedeemedByPartition", "it emits the redeemed by partition after an operator burns tokens from an holder's partition")
                    operator2Burn.logs[0].args._operator.should.be.equal(operator2, "emits the operator's address")
                    operator2Burn.logs[0].args._from.should.be.equal(investor1, "it emits the holder's address")
                    operator2Burn.logs[0].args._amount.toString().should.be.equal(tokens(5).toString(), "it emits the amount of tokens burnt")
                    operator2Burn.logs[0].args._operatorData.should.be.equal(data, "it emits the signature")
                })

                it("rejects an operator's operation to burn tokens from a specific partition due to his unauthorized access to that partition", async()=>{

                    await erc1400.operatorRedeemByPartition(classB, investor1, tokens(5), data, {from: operator2}).should.be.rejected

                })

                it("rejects the operator's operation because the signer cannot be verified", async()=>{
                    await erc1400.removeController(signer)
                    await erc1400.operatorRedeemByPartition(classB, investor1, tokens(5), data, {from: operator2}).should.be.rejected


                })

            })

        })

    })*/

    

})