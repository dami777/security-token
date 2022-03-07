const { sign } = require("crypto")

require("chai")
    .use(require("chai-as-promised"))
    .should()

const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

const tokens=(n)=>{
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
    
}

const ERC1400 = artifacts.require("./ERC1400")


contract("Transfer With Data", ([deployer, holder1, holder2])=>{

    let token
    let signature = "0x9292906193066a70b863da0861b6ea2e366074a455a4c5f6b1a79e7347734e4c72e3b654f028795e7eb8b7762a0be9b249484ac3586f809ba1bc072afe1713191b"
    let ethHash = "0xa420c3c01ff29855b5c7421b2a235747e80195ebea4a0eecde39229964686d97"
    let signer  = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"
    let data =  web3.eth.abi.encodeParameters(["bytes", "bytes32"], [signature, ethHash])
    let name = "Tangl"
    let symbol = "TAN"
    let decimal = 18
    let totalSupply = 0
    let classA = web3.utils.asciiToHex("CLASS A")
    let classB = web3.utils.asciiToHex("CLASS B")



    beforeEach( async()=>{
        token = await ERC1400.new(name, symbol, decimal, totalSupply, [classA, classB] ) //, {gas: 200000000000000000})
        

    })

    describe("deployment", ()=>{

        it("has a contract address", async()=>{
            
            token.address.should.not.be.equal("", "it has a contract address")
        })

    })

    describe("transfer with signature", ()=>{

        beforeEach(async()=>{
            await token.issue(holder1, 5, web3.utils.toHex(""))
        })

        describe("balances", ()=>{
            
            it("issued token", async()=>{
                const balance = await token.balanceOf(holder1)
                balance.toString().should.be.equal(tokens(5).toString(), "it updated the balance of the recipient")
            })
            
        })

        describe("transfer with data", ()=>{

            beforeEach(async()=>{
                await token.setController(signer)
            })

            let transfer
            
            //let data = abi.encode(signature, ethHash)

            beforeEach(async()=>{
                transfer = await token.transferWithData(holder2, tokens(2), data, {from: holder1})
            })

            it("transfers the token with the certificate", ()=>{
                transfer.logs[0].args._from.should.be.equal(holder1, "it emits the sender")
            })

        })

        describe("failure to transfer with data", ()=>{

            it("fails to transfer with data because the signer isn't recognized as a regulator", async()=>{
                await token.transferWithData(holder2, tokens(2), data, {from: holder1}).should.be.rejected
            })

        })

       describe("transfer by partition with data", ()=>{

            let transferByPartition
            let issue

            beforeEach(async()=>{
                await token.setController(signer)
                issue = await token.issueByPartition(classA, holder1, 5, web3.utils.toHex(""))
                transferByPartition = await token.transferByPartition(classA, holder2, tokens(2), data, {from: holder1})
            })

            it("emits the data with the event", ()=>{
                transferByPartition.logs[0].args._data.should.be.equal(data, "it emitted the injected certificate")
                //console.log(transferByPartition.logs[0].args)
            })

        })
        


    })


})