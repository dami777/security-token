const ERC1400 = artifacts.require('./ERC1400')

require("chai")
    .use(require("chai-as-promised"))
    .should()


contract('ERC1400', ([address1, address2, exchange])=>{

    let erc1400
    let name = "Tangl"
    let symbol = "TAN"
    let decimal = 18
    let totalSupply = 0

    beforeEach( async()=>{
        erc1400 = await ERC1400.new(name, symbol, decimal, totalSupply)
    })

    //  deployment test

    describe("deployment", ()=>{

        it("deployed the contract", async()=>{

            const contractAddress = erc1400.address 
    
            contractAddress.should.be.not.equal("", "it has a contract address")
    
        })

    })


    // test how to return reasons for failure
    describe("test failure reasons", ()=>{
        it("failed", async()=>{
            const handledFailedCase = await erc1400.canTransfer(address2, 2)
        })
    })

    //  test onboarding of investors account
    describe("test onboarding of investors", ()=>{

        let onboardResponse

        beforeEach(async()=>{
            onboardResponse = await erc1400.addToWhiteList(address2)
        })

        it("onboarded an investor successfully with an event", async()=>{
             onboardResponse.logs[0].event.should.be.equal("WhiteList", "emitted the whitelist event")
             onboardResponse.logs[0].args._investor.should.be.equal(address2, "emitted the onboared address")
             onboardResponse.logs[0].args._timeAdded.toString().should.not.be.equal("", "time is not null")
        })

        it("fails to whitelist", async()=>{
            await erc1400.addToWhiteList(address2).should.be.rejected
        })


    })
    
    //test the issuance of new tokens
    describe("new tokens", ()=>{

        let mint
        let amountToIssue = 10

        beforeEach(async()=>{
            mint = await erc1400.issueTokens(address1, amountToIssue)
        })

        it("emitted an event", async()=>{
            

            mint.logs[0].event.should.be.equal("Issued", "Issued event was emitted")

        })

        it("emits the right data in the event", async()=>{
            mint.logs[0].args._to.should.be.equal(address1, "it emitted the address passed to the event")
            mint.logs[0].args._amountIssued.toString().should.be.equal(amountToIssue.toString(), "it emitted the issued amount passed to the event")
            mint.logs[0].args._timeIssued.toString().should.not.be.equal("", "time issued is not empty")
        })

        it("updates the balance of the new token receiver", async()=>{
            const balance = await erc1400.balanceOf(address1)
            balance.toString().should.be.equal(amountToIssue.toString(), "the balance of the new tokens issued was incremented")
        })


    })

    // token transfer
    describe("token transfer", ()=>{

        let amountToIssue = 10;

        // issue tokens
        /*beforeEach(async()=>{
            await erc1400.issueTokens()
        })*/

        // test that the balance of two addresses are zero
        it("has zero tokens", async()=>{
            const addressBalance1 = await erc1400.balanceOf(address1)
            const addressBalance2 = await erc1400.balanceOf(address2)

            addressBalance1.toString().should.be.equal("0", "address 1  has zero token balance")
            addressBalance2.toString().should.be.equal("0", "address 2  has zero token balance")

        })

        

        describe("issue tokens to address 1", ()=>{

            beforeEach(async()=>{

               
                await erc1400.issueTokens(address1, amountToIssue);
               
            })

            it("updates the balance for the token receiver", async()=>{
                const addressBalance1 = await erc1400.balanceOf(address1)
                addressBalance1.toString().should.be.equal(amountToIssue.toString(), "address 1  has been issued new tokens")
            })


            it("transfers tokens to address2 from address1", async()=>{
                const transfer = await erc1400.transfer(address2, 5)
                const addressBalance1 = await erc1400.balanceOf(address1)
                const addressBalance2 = await erc1400.balanceOf(address2)

                transfer.logs[0].event.should.be.equal("Transfer", "emits the Transfer event")
                transfer.logs[0].args._amount.toString().should.be.equal("5", "emits the amount transferred")
                transfer.logs[0].args._from.should.be.equal(address1, "emits the sender of the token")
                transfer.logs[0].args._to.should.be.equal(address2, "emits the receivder of the token")
                addressBalance1.toString().should.be.equal("5", "tokens was transfered from this address")
                addressBalance2.toString().should.be.equal("5", "tokens was transfered to this address")
            })

        })

        describe("token transfer failure", ()=>{

            it("fails due to insuffient token amount", async()=>{
                await erc1400.transfer(address2, 100).should.be.rejected
            })  

        })

        

        

    })

})