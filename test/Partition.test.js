
const ERC1400 = artifacts.require("./ERC1400")
//const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'
const { ETHER_ADDRESS } = require("./helper")

require("chai")
    .use(require("chai-as-promised"))
    .should()

const tokens=(n)=>{
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
    
}

contract("ERC1400", ([issuer, investor1, investor2, investor3, investor4, investor5, operator1, operator2,])=>{

    let erc1400
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
        erc1400 = await ERC1400.new(name, symbol, decimal, totalSupply, [classA, classB])
    })

    describe("contract deployment", ()=>{

        it("has a contract address", ()=>{
            erc1400.address.should.not.be.equal("", "it has a contract address")
        })

    })

    describe("partitions of a token holder", ()=>{

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
            await erc1400.issueByPartition(classA, investor1, 5, web3.utils.toHex(""))
            
            // issue classB to investor2
            await erc1400.issueByPartition(classB, investor2, 5, web3.utils.toHex(""))

        })

        it("outputs the partitions being held by an investor", async()=>{
            const partitionsOfinvestor1 = await erc1400.partitionsOf(investor1)
            console.log(partitionsOfinvestor1)
        })

    })

    /*describe ("issuance of token by partition", ()=>{

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

    })

   describe("operator's access", ()=>{

        let issueClassA

        beforeEach(async()=>{

            issueClassA = await erc1400.issueByPartition(classA, investor1, 5, web3.utils.toHex(""))
            
        })

        

        it("confirms that an unauthorized operator can't access an holder's asset", async()=>{
            const operatorStatus = await erc1400.isOperatorForPartition(classA, operator1, investor1)
            operatorStatus.should.be.equal(false, "unauthorized operator can't access the holder's asset")
        })

        
        describe("failed operator's activities", ()=>{

            beforeEach(async()=>{
                await erc1400.authorizeOperatorByPartition(classA, operator1, {from: investor1})  // investor1 authorizes an operation to access his class A tokens
            })

            it("failed to send tokens by an unauthorized operator from an address", async()=>{

                await erc1400.operatorTransferByPartition(classA, investor1, investor2, tokens(1), web3.utils.toHex(""), data).should.be.rejected

            })


            it("failed to send tokens by an unauthorized signer", async()=>{

                await erc1400.operatorTransferByPartition(classA, investor1, investor2, tokens(1), web3.utils.toHex(""), data, {from:operator1}).should.be.rejected

            })


            

        })

        describe("authorize operator for a specific partition", ()=>{

            let authorizeForPartition
            

            beforeEach( async()=>{
                authorizeForPartition = await erc1400.authorizeOperatorByPartition(classA, operator1, {from: investor1})  // investor1 authorizes an operation to access his class A tokens
            })

            it("validates that aeraton opr has been authorized by a token holder to have access to his assets in a specific partition", async()=>{

                const operatorStatus = await erc1400.isOperatorForPartition(classA, operator1, investor1)
                operatorStatus.should.be.equal(true, "operator has been authorized to access an holder's asset")

            })

            it("validates that the access is restricted to the authorized partition", async()=>{
                const operatorStatus = await erc1400.isOperatorForPartition(classB, operator1, investor1)
                operatorStatus.should.be.equal(false, "operator's can only access to holder's class A assets only as he was authorized, hence no access to the holder's class B assets")
            })

            it("emits an event after authorization", async()=>{
                authorizeForPartition.logs[0].event.should.be.equal("AuthorizedOperatorByPartition", "it emits the event expected to be emitted")
            })


        })

        describe("authorizes an operator for all partitions", ()=>{

            let authorizeForAllPartitions

            beforeEach(async()=>{
                authorizeForAllPartitions = await erc1400.authorizeOperator(operator2, {from: investor1})
            })

            it("validates that an operator has been authorized", async()=>{

                const operatorStatus1 = await erc1400.isOperator(operator2, investor1)
                const operatorStatus2 = await erc1400.isOperator(operator2, investor2)

                operatorStatus1.should.be.equal(true, "operator has been authorized by this holder for all his partitioned assets")
                operatorStatus2.should.be.equal(false, "operator has not been authorized by this holder for all his partitioned assets")

            })

            it("emits the event for authorization of all partitions", async()=>{
                authorizeForAllPartitions.logs[0].event.should.be.equal("AuthorizedOperator", "emits the required event when an operator is authorized by an holder to access all his assets")
            })

        })

        describe("revoke operators", ()=>{

            let authorizeForPartition
            let authorizeForAllPartitions

            beforeEach(async()=>{
                authorizeForAllPartitions = await erc1400.authorizeOperator(operator2, {from: investor1})
            })
            

            beforeEach( async()=>{
                authorizeForPartition = await erc1400.authorizeOperatorByPartition(classA, operator1, {from: investor1})  // investor1 authorizes an operation to access his class A tokens
            })

            describe("revoke operator to a specific partition", ()=>{

                it("authorizes an operator to a specific partition", async()=>{
                    const operatorStatus = await erc1400.isOperatorForPartition(classA, operator1, investor1)
                    operatorStatus.should.be.equal(true, "operator has been authorized to access class A tokens of an holder's asset")
                })
    
                it("revokes an operator's access to specific partition", async()=>{
                    const revokeOperatorToPartition = await erc1400.revokeOperatorByPartition(classA, operator1, {from: investor1})
    
                    const operatorStatus = await erc1400.isOperatorForPartition(classA, operator1, investor1)
                    operatorStatus.should.be.equal(false, "operator has been revoked to access class A tokens of an holder's asset")
    
                    revokeOperatorToPartition.logs[0].event.should.be.equal("RevokedOperatorByPartition", "it emits the revoked operator by partition event after an address has been revoked")
    
                })

            })

            describe("revoke operator to all partitions", ()=>{

                it("authorizes an operator to all partitions", async()=>{
                    const operatorStatus = await erc1400.isOperator(operator2, investor1)
                    operatorStatus.should.be.equal(true, "operator has been authorized to access all partitions in an holder's asset")
                })

                it("revokes an operator to all partitions", async()=>{
                    const revokeOperatorToAllPartitions = await erc1400.revokeOperator(operator2, {from: investor1}) // revoke operator

                    const operatorStatus = await erc1400.isOperator(operator2, investor1)
                    operatorStatus.should.be.equal(false, "operator has been revoked from accessing all partitions in an holder's asset")

                    revokeOperatorToAllPartitions.logs[0].event.should.be.equal("RevokedOperator", "emits the event required to be emitted whenever an operator is revoked for all partitions")

                })

               

            })

            

        })

    })

    describe("operator's operations on assets", ()=>{

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