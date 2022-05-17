const { stringToHex, setToken, certificate, tokens } = require("./helper")

const ERC1400 = artifacts.require("./ERC1400")

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract ("Partitionless Token", ([tanglAdministrator, reitAdministrator, investor_Dami, investor_Jeff])=>{


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
    //const salt = stringToHex("random").hex
    const salt = "0xa99ee9d3aab69713b85beaef7f222d0304b9c35e89072ae3c6e0cbabcccacc0a"



    

    beforeEach(async()=>{

        
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

    describe("contract deployment", ()=>{

        it("should have contract address", ()=>{
            tanglSecurityToken.address.should.not.be.equal("", "it has a contract contract")
            reitSecurityToken.address.should.not.be.equal("", "it has a contract contract")
            
        })

    })

    describe("issuance to partitionless token", ()=>{

        let issue

        beforeEach(async()=>{

            tanglDomainData = {

                name: tanglTokenDetails.name,
                version: "1",
                chainId: 1337,
                verifyingContract: tanglSecurityToken.address,
                salt: salt //"0x0daa2a09fd91f1dcd75517ddae4699d3ade05dd587e55dc861fe82551d2c0b66"
        
            }


            const cert = await certificate(tanglAdministratorData, investorDamiData, 1, 1, tanglDomainData, tanglAdministratorPrivkey)
            issue = await tanglSecurityToken.issue(investor_Dami, 1, cert, {from: tanglAdministrator})

        })

        
        it("isssues token to the classess/default partition of the recipient", async()=>{

            const investorDamiTotalBalance = await tanglSecurityToken.balanceOf(investor_Dami)
            const investorDamiClasslessBalance = await tanglSecurityToken.balanceOfByPartition(classless, investor_Dami)
            const totalSupply = await tanglSecurityToken.totalSupply()

            issue.logs[0].event.should.be.equal("Issued", "it emitted the issued event")
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
                

            })

        })

    })
})