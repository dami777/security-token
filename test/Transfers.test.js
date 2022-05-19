
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
            web3.utils.hexToUtf8(transfer.logs[1].args._fromPartition).should.be.equal("classless", "it emitted the transferred partition")
            
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

            transferFrom.logs[0].args._from.should.be.equal(investor_Dami, "it emitted the owner's address")
            transferFrom.logs[0].args._to.should.be.equal(investor_Jeff, "it emitted the receiver's address")
            Number(transferFrom.logs[0].args._value).should.be.equal(Number(tokens(2)), "it emitted the value transferred")

            //  test the data emitted with the `TransferByPartition` event

            transferFrom.logs[1].args._from.should.be.equal(investor_Dami, "it emitted the owner's address")
            transferFrom.logs[1].args._to.should.be.equal(investor_Jeff, "it emitted the receiver's address")
            web3.utils.hexToUtf8(transferFrom.logs[1].args._fromPartition).should.be.equal("classless", "it emitted the transferred partition")
            
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

        it("should revert if spender attempts to send to ether address", async()=>{
            
            approve = await tanglSecurityToken.approve(tanglAdministrator, tokens(2), {from: investor_Dami})
            await tanglSecurityToken.transferFrom(investor_Dami, ETHER_ADDRESS, tokens(2), {from: tanglAdministrator}).should.be.rejectedWith(reverts.INVALID_RECEIVER)

        })

        it("should revert if the owner does not have sufficient amount to be sent", async()=>{
            await tanglSecurityToken.approve(escrow, tokens(20), {from: investor_Dami})
            await tanglSecurityToken.transferFrom(investor_Dami, investor_Jeff, tokens(20), {from: escrow}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)

        })

    })

    describe("transfer with data", ()=>{

        let transferWithData
        let cert

       beforeEach(async()=>{

        /**
         * Administrator provides certificate 
         * Investor uses the certificate to authorize and validate transaction
         */

        cert = await certificate(investorDamiData, investorJeffData, BigInt(tokens(3)), 1, tanglDomainData, tanglAdministratorPrivkey)
        transferWithData = await tanglSecurityToken.transferWithData(investor_Jeff, tokens(3), cert, {from: investor_Dami})

       })


       it("emits the Transfer and TransferByPartition event", ()=>{

            transferWithData.logs[0].event.should.be.equal("Transfer", "it emits the Transfer event")
            transferWithData.logs[1].event.should.be.equal("TransferByPartition", "it emits the TransferByPartition event")


            transferWithData.logs[0].event.should.be.equal("Transfer", "it emits the transfer event")
            transferWithData.logs[1].event.should.be.equal("TransferByPartition", "it emits the transfer by partition event")
            
            //  test the data emitted with the `Transfer` event

            transferWithData.logs[0].args._from.should.be.equal(investor_Dami, "it emitted the sender's address")
            transferWithData.logs[0].args._to.should.be.equal(investor_Jeff, "it emitted the receiver's address")
            Number(transferWithData.logs[0].args._value).should.be.equal(Number(tokens(3)), "it emitted the value transferred")

            //  test the data emitted with the `TransferByPartition` event

            transferWithData.logs[1].args._from.should.be.equal(investor_Dami, "it emitted the sender's address")
            transferWithData.logs[1].args._to.should.be.equal(investor_Jeff, "it emitted the receiver's address")
            web3.utils.hexToUtf8(transferWithData.logs[1].args._fromPartition).should.be.equal("classless", "it emitted the transferred partition")
            
            Number(transferWithData.logs[1].args._value).should.be.equal(Number(tokens(3)), "it emitted the value transferred")

       })

       it("updates the balances of the sender and receiver" , async()=>{

            const totalFromBalance = await tanglSecurityToken.balanceOf(investor_Dami)
            const partitionlessFromBalance = await tanglSecurityToken.balanceOfByPartition(classless, investor_Dami)

            Number(totalFromBalance).should.be.equal(Number(tokens(7)), "the sender released the tokens successfully")
            Number(partitionlessFromBalance).should.be.equal(Number(tokens(7)), "the token was moved from the partitionless balance")

            
            const totalToBalance = await tanglSecurityToken.balanceOf(investor_Jeff)
            const partitionlessToBalance = await tanglSecurityToken.balanceOfByPartition(classless, investor_Jeff)

            Number(totalToBalance).should.be.equal(Number(tokens(3)), "the recipient received the token")
            Number(partitionlessToBalance).should.be.equal(Number(tokens(3)), "the token was moved to the partitionless balance")
       
       
        })


        it("should revert if the sender does not have sufficient amount to be sent", async()=>{
            
            cert = await certificate(investorDamiData, investorJeffData, BigInt(tokens(30)), 2, tanglDomainData, tanglAdministratorPrivkey)

            await tanglSecurityToken.transferWithData(investor_Jeff, tokens(30), cert, {from: investor_Dami}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)

        })


        it("should revert if the sender tries to use an empty data", async()=>{
            
            const cert = stringToHex("").hex
            await tanglSecurityToken.transferWithData(investor_Jeff, tokens(2), cert, {from: investor_Dami}).should.be.rejectedWith(reverts.EMPTY_DATA)

        })

        it("fails to transfer to ether address", async()=>{

            cert = await certificate(investorDamiData, investorJeffData, BigInt(tokens(2)), 3, tanglDomainData, tanglAdministratorPrivkey)

            await tanglSecurityToken.transferWithData(ETHER_ADDRESS, tokens(2), cert, {from: investor_Dami}).should.be.rejectedWith(reverts.INVALID_RECEIVER)
        })




    })

    describe("transferFrom with data", ()=>{

        let cert
        let transferFromWithData

        beforeEach(async()=>{

            /**
             * Approve spender
             * Spender sends token with certificate
             */

             approve = await tanglSecurityToken.approve(tanglAdministrator, tokens(2), {from: investor_Dami})
             cert = await certificate(investorDamiData, investorJeffData, BigInt(tokens(2)), 1, tanglDomainData, tanglAdministratorPrivkey)
             transferFromWithData = await tanglSecurityToken.transferFromWithData(investor_Dami, investor_Jeff, tokens(2), cert, {from: tanglAdministrator})

        })


        it("emits the transfer and transfer by partition event", async()=>{

            transferFromWithData.logs[0].event.should.be.equal("Transfer", "it emits the transfer event")
            transferFromWithData.logs[1].event.should.be.equal("TransferByPartition", "it emits the transfer by partition event")
            
            //  test the data emitted with the `Transfer` event

            transferFromWithData.logs[0].args._from.should.be.equal(investor_Dami, "it emitted the owner's address")
            transferFromWithData.logs[0].args._to.should.be.equal(investor_Jeff, "it emitted the receiver's address")
            Number(transferFromWithData.logs[0].args._value).should.be.equal(Number(tokens(2)), "it emitted the value transferred")

            //  test the data emitted with the `TransferByPartition` event

            transferFromWithData.logs[1].args._from.should.be.equal(investor_Dami, "it emitted the owner's address")
            transferFromWithData.logs[1].args._to.should.be.equal(investor_Jeff, "it emitted the receiver's address")
            web3.utils.hexToUtf8(transferFromWithData.logs[1].args._fromPartition).should.be.equal("classless", "it emitted the transferred partition")
            
            Number(transferFromWithData.logs[1].args._value).should.be.equal(Number(tokens(2)), "it emitted the value transferred")

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
            
            cert = await certificate(investorDamiData, investorJeffData, BigInt(tokens(3)), 2, tanglDomainData, tanglAdministratorPrivkey)
            await tanglSecurityToken.transferFromWithData(investor_Dami, investor_Jeff, tokens(3), cert, {from: tanglAdministrator}).should.be.rejectedWith(reverts.INSUFFICIENT_ALLOWANCE)

        })

        it("should revert if the owner does not have sufficient amount to be sent by the spender", async()=>{

            await tanglSecurityToken.approve(escrow, tokens(20), {from: investor_Dami})
            await tanglSecurityToken.transferFromWithData(investor_Dami, investor_Jeff, tokens(20), cert, {from: escrow}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)

        })


        it("should revert if spender attempts to send to ether address", async()=>{

            await tanglSecurityToken.approve(escrow, tokens(2), {from: investor_Dami})
            await tanglSecurityToken.transferFromWithData(investor_Dami, ETHER_ADDRESS, tokens(2), cert, {from: escrow}).should.be.rejectedWith(reverts.INVALID_RECEIVER)

        })

        





    })


    describe("transfer by partition", ()=>{

        let issueByPartition
        let issuanceCert
        let transferCert
        let transferByPartition

        beforeEach(async()=>{

            

            issuanceCert = await certificate(tanglAdministratorData, investorDamiData, 10, 2, tanglDomainData, tanglAdministratorPrivkey)
            issueByPartition = await tanglSecurityToken.issueByPartition(classA.hex, investor_Dami, 10, issuanceCert, {from: tanglAdministrator})

            transferCert = await certificate(investorDamiData, investorJeffData, BigInt(tokens(2)), 3, tanglDomainData, tanglAdministratorPrivkey)
            transferByPartition = await tanglSecurityToken.transferByPartition(classA.hex, investor_Jeff, tokens(2), transferCert, {from: investor_Dami})
        })

        it("emits the Issued and IssuedByPartition event", ()=>{

            /**
             * A separate test will be conducted for issuance in another test script
             */

            issueByPartition.logs[0].event.should.be.equal("Issued", "it emits the Issued event")
            issueByPartition.logs[1].event.should.be.equal("IssuedByPartition", "it emits the IssuedByPartition event")

        })

        it("emits the Transfer and TransferByPartition event", ()=>{

            transferByPartition.logs[0].event.should.be.equal("Transfer", "it emits the transfer event")
            transferByPartition.logs[1].event.should.be.equal("TransferByPartition", "it emits the transfer by partition event")

            
            //  test the data emitted with the `Transfer` event

            transferByPartition.logs[0].args._from.should.be.equal(investor_Dami, "it emitted the sender's address")
            transferByPartition.logs[0].args._to.should.be.equal(investor_Jeff, "it emitted the receiver's address")
            Number(transferByPartition.logs[0].args._value).should.be.equal(Number(tokens(2)), "it emitted the value transferred")

            //  test the data emitted with the `TransferByPartition` event

            transferByPartition.logs[1].args._from.should.be.equal(investor_Dami, "it emitted the owner's address")
            transferByPartition.logs[1].args._to.should.be.equal(investor_Jeff, "it emitted the receiver's address")
            web3.utils.hexToUtf8(transferByPartition.logs[1].args._fromPartition).should.be.equal("CLASS A", "it emitted the transferred partition")
            
            Number(transferByPartition.logs[1].args._value).should.be.equal(Number(tokens(2)), "it emitted the value transferred")

            
        })

        it("updates the balance of the of the sender and receiver after transfer", async()=>{

            const totalFromBalance = await tanglSecurityToken.balanceOf(investor_Dami)
            const classAFromBalance = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Dami)

            Number(totalFromBalance).should.be.equal(Number(tokens(18)), "the sender released the tokens successfully")
            Number(classAFromBalance).should.be.equal(Number(tokens(8)), "the token was moved from the partitionless balance")

            
            const totalToBalance = await tanglSecurityToken.balanceOf(investor_Jeff)
            const classAToBalance = await tanglSecurityToken.balanceOfByPartition(classA.hex, investor_Jeff)

            Number(totalToBalance).should.be.equal(Number(tokens(2)), "the recipient received the token")
            Number(classAToBalance).should.be.equal(Number(tokens(2)), "the token was moved to the partitionless balance")

        })

        it("reverts if certificate is not used in the transfer", async()=>{

            const cert = stringToHex("").hex 
            await tanglSecurityToken.transferByPartition(classA.hex, investor_Jeff, tokens(2), cert, {from: investor_Dami}).should.be.rejectedWith(reverts.EMPTY_DATA)


        })


        it("reverts if transfer is attempted to be sent to ether address", async()=>{

            cert = await certificate(investorDamiData, investorJeffData, BigInt(tokens(2)), 4, tanglDomainData, tanglAdministratorPrivkey) 
            await tanglSecurityToken.transferByPartition(classA.hex, ETHER_ADDRESS, tokens(2), cert, {from: investor_Dami}).should.be.rejectedWith(reverts.INVALID_RECEIVER)


        })


        it("reverts if transfer is attempted with insufficient balance", async()=>{

            cert = await certificate(investorDamiData, investorJeffData, BigInt(tokens(20)), 5, tanglDomainData, tanglAdministratorPrivkey) 
            await tanglSecurityToken.transferByPartition(classA.hex, investor_Jeff, tokens(20), cert, {from: investor_Dami}).should.be.rejectedWith(reverts.INSUFFICIENT_BALANCE)


        })


        
    

    })


})



/**
 * Reconduct unit test for the following using the certificate:
 * 
 * [-]   Transfer
 * [-]   TransferFrom
 * [-]   TransferWithData
 * [-]   TransferFromWithData
 * []   TransferByPartition
 * 
 */