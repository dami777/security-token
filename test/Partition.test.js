
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

contract("ERC1400", ([address1, address2, address3, operator1, operator2])=>{

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

            issueClassA = await erc1400.issueByPartition(classA, address2, tokens(5), web3.utils.toHex(""))
            
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

                issueClassB = await erc1400.issueByPartition(classB, address2, tokens(10), web3.utils.toHex(""))

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
            issueClassA = await erc1400.issueByPartition(classA, address2, tokens(5), web3.utils.toHex(""))
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

    describe("operator's activities", ()=>{

        let issueClassA

        beforeEach(async()=>{

            issueClassA = await erc1400.issueByPartition(classA, address2, tokens(5), web3.utils.toHex(""))
            
        })

        

        it("confirms that an unauthorized operator can't access an holder's asset", async()=>{
            const operatorStatus = await erc1400.isOperatorForPartition(address2, operator1, classA)
            operatorStatus.should.be.equal(false, "unauthorized operator can't access the holder's asset")
        })

        
        describe("failed operator's activities", ()=>{



            it("failed to send tokens by an unauthorized operator from an address", async()=>{

                await erc1400.operatorTransferByPartition(classA, address2, address3, tokens(1), web3.utils.toHex(""), web3.utils.toHex("")).should.be.rejected

            })

        })

        describe("authorize operator", ()=>{

            let authorizeForPartition
            let authorizeForAllPartitions

            beforeEach( async()=>{
                authorizeForPartition = await erc1400.authorizeOperatorByPartition()
            })

        })

    })





})