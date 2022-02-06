
const ERC1400 = artifacts.require("./ERC1400")
const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

require("chai")
    .use(require("chai-as-promised"))
    .should()

const tokens=(n)=>{
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
    
}

contract("ERC1400", ([address1, address2, address3, address4, address5, address6, operator1, operator2,])=>{

    let erc1400
    let name = "Tangl"
    let symbol = "TAN"
    let decimal = 18
    let totalSupply = 0
    let classA = web3.utils.asciiToHex("CLASS A")
    let classB = web3.utils.asciiToHex("CLASS B")

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

        it("returns a zero balance in share class A for address1", async()=>{
            const balance = await erc1400.balanceOfByPartition(classA, address1)
            balance.toString().should.be.equal("0", "address1 has 0 balance in class A")
        }) 

    })

    describe ("issuance of token by partition", ()=>{

        let issueClassA

        beforeEach(async()=>{

            issueClassA = await erc1400.issueByPartition(classA, address2, 5, web3.utils.toHex(""))
            
        })

        describe("issuance of class A tokens", ()=>{

            it("updates the global balance of the token holder", async()=>{
                const address2TotalBalance = await erc1400.balanceOf(address2)
                address2TotalBalance.toString().should.be.equal(tokens(5).toString(), "total balance increased")
            })

            it("updates the balance of the token holder in class A", async()=>{
                const classAbalance = await erc1400.balanceOfByPartition(classA, address2)
                classAbalance.toString().should.be.equal(tokens(5).toString(), "it updates the class A token balance of the holder")
            })

            it("doesn't affect balance in other partitions", async()=>{
                const classBbalance = await erc1400.balanceOfByPartition(classB, address2)
                classBbalance.toString().should.be.equal(tokens(0).toString(), "issuance to class A doesn't affect class B balance")
            })

        })

        describe("issuance of class B tokens", ()=>{

            beforeEach(async()=>{

                issueClassB = await erc1400.issueByPartition(classB, address2, 10, web3.utils.toHex(""))

            })

           it("updates the global balance of the token holder", async()=>{
                const address2TotalBalance = await erc1400.balanceOf(address2)
                address2TotalBalance.toString().should.be.equal(tokens(15).toString(), "the global balance of the token holder increases after being issued class B tokens")
           })

           it("updates class B balance of the holder", async()=>{
                const classBbalance = await erc1400.balanceOfByPartition(classB, address2)
                classBbalance.toString().should.be.equal(tokens(10).toString(), "it updates the class B balance of the holder")
           })

           it("doesn't affect the balance in other partitions", async()=>{
                const classAbalance = await erc1400.balanceOfByPartition(classA, address2)
                classAbalance.toString().should.be.equal(tokens(5).toString(), "class B issuance doen't affect class A balance") 
           })

        })

        

    })

    describe("tokens transfer from partitons", ()=>{


        let issueClassA
        //let issueClassB

        beforeEach(async()=>{
            issueClassA = await erc1400.issueByPartition(classA, address2, 5, web3.utils.toHex(""))
        })

        describe("successful transfer", ()=>{

            let classAtokenTransfer

            beforeEach(async()=>{
                classAtokenTransfer = await erc1400.transferByPartition(classA, address3, tokens(2), web3.utils.toHex(""), {from: address2})
            })

           it("transfers tokens in class A from address 2 to address3", async()=>{
               
                const address2ClassABalance = await erc1400.balanceOfByPartition(classA, address2)
                address2ClassABalance.toString().should.be.equal(tokens(3).toString(), "class A balance of sender reduced accordingly")

                const address3ClassABalance = await erc1400.balanceOfByPartition(classA, address3)
                address3ClassABalance.toString().should.be.equal(tokens(2).toString(), "class A balance of token receiver increases as expected")


            })

            it("reflects in the global balance of the sender and receiver", async()=>{
                const address2GlobalBalance = await erc1400.balanceOf(address2)
                address2GlobalBalance.toString().should.be.equal(tokens(3).toString(), "the global balance of the sender updates after transfer")

                const address3GlobalBalance = await erc1400.balanceOf(address3)
                address3GlobalBalance.toString().should.be.equal(tokens(2).toString(), "the global balance of the receiver updates after transfer")
            })

            it("emits events", async()=>{
                classAtokenTransfer.logs[0].event.should.be.equal("TransferByPartition", "it emits the transfer by partition event")
                classAtokenTransfer.logs[1].event.should.be.equal("Transfer", "it emits the transfer event")
                
            })

        })

        describe("failed transfer", ()=>{

            it("failed to transfer tokens to ether address", async()=>{
                await erc1400.transferByPartition(classA, ETHER_ADDRESS, tokens(2), web3.utils.toHex(""), {from: address2}).should.be.rejected
            })

            it("failed due to insufficient tokens", async()=>[
                await erc1400.transferByPartition(classB, address3, tokens(2), web3.utils.toHex(""), {from: address2}).should.be.rejected
            ])


        })

    })

    describe("operator's access", ()=>{

        let issueClassA

        beforeEach(async()=>{

            issueClassA = await erc1400.issueByPartition(classA, address2, 5, web3.utils.toHex(""))
            
        })

        

        it("confirms that an unauthorized operator can't access an holder's asset", async()=>{
            const operatorStatus = await erc1400.isOperatorForPartition(classA, operator1, address2)
            operatorStatus.should.be.equal(false, "unauthorized operator can't access the holder's asset")
        })

        
        describe("failed operator's activities", ()=>{



            it("failed to send tokens by an unauthorized operator from an address", async()=>{

                await erc1400.operatorTransferByPartition(classA, address2, address3, tokens(1), web3.utils.toHex(""), web3.utils.toHex("")).should.be.rejected

            })

        })

        describe("authorize operator for a specific partition", ()=>{

            let authorizeForPartition
            

            beforeEach( async()=>{
                authorizeForPartition = await erc1400.authorizeOperatorByPartition(classA, operator1, {from: address2})  // address2 authorizes an operation to access his class A tokens
            })

            it("validates that an operator has been authorized by a token holder to have access to his assets in a specific partition", async()=>{

                const operatorStatus = await erc1400.isOperatorForPartition(classA, operator1, address2)
                operatorStatus.should.be.equal(true, "operator has been authorized to access an holder's asset")

            })

            it("validates that the access is restricted to the authorized partition", async()=>{
                const operatorStatus = await erc1400.isOperatorForPartition(classB, operator1, address2)
                operatorStatus.should.be.equal(false, "operator's can only access to holder's class A assets only as he was authorized, hence no access to the holder's class B assets")
            })

            it("emits an event after authorization", async()=>{
                authorizeForPartition.logs[0].event.should.be.equal("AuthorizedOperatorByPartition", "it emits the event expected to be emitted")
            })


        })

        describe("authorizes an operator for all partitions", ()=>{

            let authorizeForAllPartitions

            beforeEach(async()=>{
                authorizeForAllPartitions = await erc1400.authorizeOperator(operator2, {from: address2})
            })

            it("validates that an operator has been authorized", async()=>{

                const operatorStatus1 = await erc1400.isOperator(operator2, address2)
                const operatorStatus2 = await erc1400.isOperator(operator2, address3)

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
                authorizeForAllPartitions = await erc1400.authorizeOperator(operator2, {from: address2})
            })
            

            beforeEach( async()=>{
                authorizeForPartition = await erc1400.authorizeOperatorByPartition(classA, operator1, {from: address2})  // address2 authorizes an operation to access his class A tokens
            })

            describe("revoke operator to a specific partition", ()=>{

                it("authorizes an operator to a specific partition", async()=>{
                    const operatorStatus = await erc1400.isOperatorForPartition(classA, operator1, address2)
                    operatorStatus.should.be.equal(true, "operator has been authorized to access class A tokens of an holder's asset")
                })
    
                it("revokes an operator's access to specific partition", async()=>{
                    const revokeOperatorToPartition = await erc1400.revokeOperatorByPartition(classA, operator1, {from: address2})
    
                    const operatorStatus = await erc1400.isOperatorForPartition(classA, operator1, address2)
                    operatorStatus.should.be.equal(false, "operator has been revoked to access class A tokens of an holder's asset")
    
                    revokeOperatorToPartition.logs[0].event.should.be.equal("RevokedOperatorByPartition", "it emits the revoked operator by partition event after an address has been revoked")
    
                })

            })

            describe("revoke operator to all partitions", ()=>{

                it("authorizes an operator to all partitions", async()=>{
                    const operatorStatus = await erc1400.isOperator(operator2, address2)
                    operatorStatus.should.be.equal(true, "operator has been authorized to access all partitions in an holder's asset")
                })

                it("revokes an operator to all partitions", async()=>{
                    const revokeOperatorToAllPartitions = await erc1400.revokeOperator(operator2, {from: address2}) // revoke operator

                    const operatorStatus = await erc1400.isOperator(operator2, address2)
                    operatorStatus.should.be.equal(false, "operator has been revoked from accessing all partitions in an holder's asset")

                    revokeOperatorToAllPartitions.logs[0].event.should.be.equal("RevokedOperator", "emits the event required to be emitted whenever an operator is revoked for all partitions")

                })

               

            })

            

        })

    })

    describe("operator's operations on assets", ()=>{

        // issuance variable for address2

        let issueClassAToAdddress2
        let issueClassBToAdddress2

        // issuance variable for address3

        let issueClassAToAdddress3
        let issueClassBToAdddress3



        // authorization variables to address2

        let authorizeForPartitionAddress2
        let authorizeForAllPartitionAddress2


        // authorization variables to address3

        let authorizeForPartitionAddress3
        let authorizeForAllPartitionAddress3

        beforeEach(async()=>{
            issueClassAToAdddress2 = await erc1400.issueByPartition(classA, address2, 20, web3.utils.toHex(""))    //issue class A tokens to address2
            issueClassBToAdddress2 = await erc1400.issueByPartition(classB, address2, 20, web3.utils.toHex(""))    //issue class A tokens to address2


            issueClassAToAdddress3 = await erc1400.issueByPartition(classA, address3, 20, web3.utils.toHex(""))    //issue class A tokens to address3
            issueClassBToAdddress3 = await erc1400.issueByPartition(classB, address3, 20, web3.utils.toHex(""))    //issue class A tokens to address3


            // authorize operator1 accross all partitions

            await erc1400.authorizeOperator(operator1, {from: address2})
            await erc1400.authorizeOperator(operator1, {from: address3})



            // authorize operator2 accross specific partitions

            await erc1400.authorizeOperatorByPartition(classA, operator2, {from: address2}) // authorize operator2 to class A
            await erc1400.authorizeOperatorByPartition(classB, operator2, {from: address3}) // authorize operator2 to class B



        })

        it("issued tokens to address 2 and 3", async()=>{
            const address2Balance = await erc1400.balanceOf(address2)
            address2Balance.toString().should.be.equal(tokens(40).toString(), "new tokens were issued to address2")

            const address3Balance = await erc1400.balanceOf(address3)
            address3Balance.toString().should.be.equal(tokens(40).toString(), "new tokens were issued to address3")
        })

        describe("operator 1 transfer activities", ()=>{

            it("transfers tokens from address2's class A tokens to other addresses", async()=>{


                const transfer = await erc1400.operatorTransferByPartition(classA, address2, address4, tokens(5), web3.utils.toHex(""), web3.utils.toHex(""), {from: operator1})

                const address2Balance = await erc1400.balanceOfByPartition(classA, address2)
                const address4Balance = await erc1400.balanceOfByPartition(classA, address4)

                address2Balance.toString().should.be.equal(tokens(15).toString(), "operator sent tokens from this account")
                address4Balance.toString().should.be.equal(tokens(5).toString(), "operator sent tokens from an account to this account")

            })


            it("transfers tokens from address2's class B tokens to other addresses", async()=>{


                const transfer = await erc1400.operatorTransferByPartition(classB, address2, address5, tokens(10), web3.utils.toHex(""), web3.utils.toHex(""), {from: operator1})

                const address2Balance = await erc1400.balanceOfByPartition(classB, address2)
                const address5Balance = await erc1400.balanceOfByPartition(classB, address5)

                address2Balance.toString().should.be.equal(tokens(10).toString(), "operator sent tokens from this account")
                address5Balance.toString().should.be.equal(tokens(10).toString(), "operator sent tokens from an account to this account")

            })

            it("fails to transfer tokens from the specified partition due to holder's insufficient token in that partition", async()=>{
                await erc1400.operatorTransferByPartition(classB, address2, address5, tokens(40), web3.utils.toHex(""), web3.utils.toHex(""), {from: operator1}).should.be.rejected
            })

        })

        describe("operator 2 transfer activities", ()=>{

            it("transfers tokens from the class A partition it has been given to", async()=>{

                const transfer = await erc1400.operatorTransferByPartition(classA, address2, address5, tokens(20), web3.utils.toHex(""), web3.utils.toHex(""), {from: operator2})

                const address2Balance = await erc1400.balanceOfByPartition(classA, address2)
                const address5Balance = await erc1400.balanceOfByPartition(classA, address5)

                address2Balance.toString().should.be.equal(tokens(0).toString(), "operator sent tokens from this account")
                address5Balance.toString().should.be.equal(tokens(20).toString(), "operator sent tokens from an account to this account")


            })


            it("transfers tokens from class B partition it has been givn access to", async()=>{

                const transfer = await erc1400.operatorTransferByPartition(classB, address3, address4, tokens(10), web3.utils.toHex(""), web3.utils.toHex(""), {from: operator3})

                const address3Balance = await erc1400.balanceOfByPartition(classB, address2)
                const address4Balance = await erc1400.balanceOfByPartition(classB, address5)

                address3Balance.toString().should.be.equal(tokens(10).toString(), "operator sent tokens from this account")
                address4Balance.toString().should.be.equal(tokens(10).toString(), "operator sent tokens from an account to this account")

            })

        })

    



    })







})