
require("chai")
    .use(require("chai-as-promised"))
    .should()


const { stringToHex, setToken, certificate, tokens, ETHER_ADDRESS, reverts } = require("./helper")

const ERC1400 = artifacts.require("./ERC1400")


contract("Transfers", ([tanglAdministrator, investor_Dami, investor_Jeff, escrow])=>{

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

    const tanglAdministratorPrivkey = "30890afa462d7fc0b7797ee9ce74d46d6e8153bf5fff8664479355d50f05acd5"
    const reitAdministratorPrivKey = "1f81c78ea6017f3fa79accbe40450f373a02af61763cdb7f082284ee8716b40d"
    const salt = "0xa99ee9d3aab69713b85beaef7f222d0304b9c35e89072ae3c6e0cbabcccacc0a"
    

    beforeEach( async()=>{

        tanglSecurityToken = await ERC1400.new(tanglTokenDetails.name, tanglTokenDetails.symbol, tanglTokenDetails.decimal, {from: tanglAdministrator})
        reitSecurityToken = await ERC1400.new(reitTokenDetails.name, reitTokenDetails.symbol, reitTokenDetails.decimal, {from: reitAdministrator})

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

    describe("deployment", ()=>{

        it("has a contract address", async()=>{
            
            tanglSecurityToken.address.should.not.be.equal("", "it has a contract address")
        })

    })

    /*describe("transfer with signature", ()=>{

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

            it("fails because either or neither of the accounts are whitelisted", async()=>{
                const data =  web3.eth.abi.encodeParameters(["bytes", "bytes32", "bool", "bool"], [signature, ethHash, false, toIsWhiteListed])
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
            })

        })

        describe("transfer by partition without data", ()=>{
            let transferByPartition
            let issue

            beforeEach(async()=>{
                issue = await token.issueByPartition(classA, holder1, 5, web3.utils.toHex(""))
                transferByPartition = await token.transferByPartition(classA, holder2, tokens(2), web3.utils.toHex(""), {from: holder1})
            })

            it("emits the data with the event", ()=>{
                transferByPartition.logs[0].args._data.should.be.equal("0x00", "it emitted an emptyn data")
            })  
        })


    })*/


})



/**
 * Reconduct unit test for the following using the certificate:
 * 
 * []   Transfer
 * []   TransferFrom
 * []   TransferWithData
 * 
 */