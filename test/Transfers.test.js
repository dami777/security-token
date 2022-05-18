
require("chai")
    .use(require("chai-as-promised"))
    .should()


const { stringToHex, setToken, certificate, tokens, ETHER_ADDRESS, reverts } = require("./helper")

const ERC1400 = artifacts.require("./ERC1400")


contract("Transfers", ([tanglAdministrator, reitAdministrator, investor_Dami, investor_Jeff, escrow])=>{

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

        /**
         * issue classless tokens with certificate
         */

        const cert = await certificate(tanglAdministratorData, investorDamiData, 10, 1, tanglDomainData, tanglAdministratorPrivkey)
        issue = await tanglSecurityToken.issue(investor_Dami, 10, cert, {from: tanglAdministrator})
    
    })

    describe("deployment", ()=>{

        it("has a contract address", async()=>{
            
            tanglSecurityToken.address.should.not.be.equal("", "it has a contract address")
        })

    })

    describe("transfer", ()=>{

        let transfer

        beforeEach(async()=>{
            transfer = await tanglSecurityToken.transfer(investor_Jeff, tokens(2), {from: investor_Dami}) 
        })

        it("updates the sender's balance", async()=>{

            const totalBalance = await tanglSecurityToken.balanceOf(investor_Dami)
            const partitionlessBalance = await tanglSecurityToken.balanceOfByPartition(classless, investor_Dami)

            Number(totalBalance).should.be.equal(Number(tokens(8)), "the sender released the tokens successfully")
            Number(partitionlessBalance).should.be.equal(Number(tokens(8)), "the token was moved from the partitionless balance")
            
        })

        it("updates the receiver's balance", async()=>{

            const totalBalance = await tanglSecurityToken.balanceOf(investor_Jeff)
            const partitionlessBalance = await tanglSecurityToken.balanceOfByPartition(classless, investor_Jeff)

            Number(totalBalance).should.be.equal(Number(tokens(2)), "the recipient received the token")
            Number(partitionlessBalance).should.be.equal(Number(tokens(2)), "the token was moved to the partitionless balance")
        
        })

        it("emits the Transfer and TransferByPartition events", ()=>{
            transfer.logs[0].event.should.be.equal("Transfer", "it emits the transfer event")
            transfer.logs[1].event.should.be.equal("TransferByPartition", "it emits the transfer by partition event")
            
            //  test the data emitted with the `Transfer` event

            transfer.logs[0].args._from.should.be.equal(investor_Dami, "it emitted the sender's address")
            transfer.logs[0].args._to.should.be.equal(investor_Jeff, "it emitted the receiver's address")
            Number(transfer.logs[0].args._value).should.be.equal(Number(tokens(2)), "it emitted the value transferred")

            //  test the data emitted with the `TransferByPartition` event

            transfer.logs[1].args._from.should.be.equal(investor_Dami, "it emitted the sender's address")
            transfer.logs[1].args._to.should.be.equal(investor_Jeff, "it emitted the receiver's address")
            web3.utils.hexToUtf8(transfer.logs[1].args._fromPartition).should.be.equal("classless", "it emitted the issued partition")
            
            Number(transfer.logs[1].args._value).should.be.equal(Number(tokens(2)), "it emitted the value transferred")

            
        })

        it("fails to transfer due to insufficient balance", async()=>{
            await tanglSecurityToken.transfer(investor_Jeff, tokens(20), {from: investor_Dami}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)
        })

        it("fails to transfer to ether address", async()=>{
            await tanglSecurityToken.transfer(ETHER_ADDRESS, tokens(2), {from: investor_Dami}).should.be.rejectedWith(reverts.INVALID_RECEIVER)
        })

    })

    describe("transfer From", ()=>{

        /**
         * []   investor approves some amount to the spender
         * []   spender sends tokens
         */

        let approve 
        let transferFrom 

        beforeEach(async()=>{

            approve = await tanglSecurityToken.approve(tanglAdministrator, tokens(2), {from: investor_Dami})
            transferFrom = await tanglSecurityToken.transferFrom(investor_Dami, investor_Jeff, tokens(2), {from: tanglAdministrator})

        })

        it("emits the Approval", ()=>{

            approve.logs[0].event.should.be.equal("Approval", "it emits the approval event")
            approve.logs[0].args._owner.should.be.equal(investor_Dami, "it emits the owner's address")
            approve.logs[0].args._spender.should.be.equal(tanglAdministrator, "it emits the spender's address")
            Number(approve.logs[0].args._value).should.be.equal(Number(tokens(2)), "it emits the amount approved to the spender")

        })

        it("emits the transfer and transfer by partition event", async()=>{
            transferFrom.logs[0].event.should.be.equal("Transfer", "it emits the transfer event")
            transferFrom.logs[1].event.should.be.equal("TransferByPartition", "it emits the transfer by partition event")
            
            //  test the data emitted with the `Transfer` event

            transferFrom.logs[0].args._from.should.be.equal(investor_Dami, "it emitted the sender's address")
            transferFrom.logs[0].args._to.should.be.equal(investor_Jeff, "it emitted the receiver's address")
            Number(transferFrom.logs[0].args._value).should.be.equal(Number(tokens(2)), "it emitted the value transferred")

            //  test the data emitted with the `TransferByPartition` event

            transferFrom.logs[1].args._from.should.be.equal(investor_Dami, "it emitted the sender's address")
            transferFrom.logs[1].args._to.should.be.equal(investor_Jeff, "it emitted the receiver's address")
            web3.utils.hexToUtf8(transferFrom.logs[1].args._fromPartition).should.be.equal("classless", "it emitted the issued partition")
            
            Number(transferFrom.logs[1].args._value).should.be.equal(Number(tokens(2)), "it emitted the value transferred")

        })

        it("updates the balances of the `from` and `to` ", async()=>{

            const totalFromBalance = await tanglSecurityToken.balanceOf(investor_Dami)
            const partitionlessFromBalance = await tanglSecurityToken.balanceOfByPartition(classless, investor_Dami)

            Number(totalFromBalance).should.be.equal(Number(tokens(8)), "the sender released the tokens successfully")
            Number(partitionlessFromBalance).should.be.equal(Number(tokens(8)), "the token was moved from the partitionless balance")

            
            const totalToBalance = await tanglSecurityToken.balanceOf(investor_Jeff)
            const partitionlessToBalance = await tanglSecurityToken.balanceOfByPartition(classless, investor_Jeff)

            Number(totalToBalance).should.be.equal(Number(tokens(2)), "the recipient received the token")
            Number(partitionlessToBalance).should.be.equal(Number(tokens(2)), "the token was moved to the partitionless balance")
        
        })

        it("should revert if spender attempts to spend beyond the allowed amount", async()=>{
            
            await tanglSecurityToken.transferFrom(investor_Dami, investor_Jeff, tokens(3), {from: tanglAdministrator}).should.be.rejectedWith(reverts.INSUFFICIENT_ALLOWANCE)

        })

        it("should revert if the owner does not have sufficient amount to be sent", async()=>{
            await tanglSecurityToken.approve(escrow, tokens(20), {from: investor_Dami})
            await tanglSecurityToken.transferFrom(investor_Dami, investor_Jeff, tokens(20), {from: escrow}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)

        })

    })


    describe("transfer with data", ()=>{

    })


    describe("transfer by partition", ()=>{

    })


})



/**
 * Reconduct unit test for the following using the certificate:
 * 
 * [-]   Transfer
 * []   TransferFrom
 * []   TransferWithData
 * 
 */