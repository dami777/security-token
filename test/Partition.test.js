
const ERC1400 = artifacts.require("./ERC1400")

require("chai")
    .use(require("chai-as-promised"))
    .should()

const tokens=(n)=>{
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
    
}

contract("ERC1400", ([address1, address2, operator])=>{

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

            issueClassA = await erc1400.issueByPartition(classA, address2, tokens(5), web3.utils.toHex("us"))
            
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

        })

        

    })

    })

})