const ERC1400 = artifacts.require('./ERC1400')

require("chai")
    .use(require("chai-as-promised"))
    .should()


contract('ERC1400', ([address1, address2, exchange])=>{

    let erc1400
    let name = "Tangl"
    let symbol = "TAN"
    let decimal = 18
    let totalSupply = 10

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

    // test bytes
    describe("bytes test", ()=>{
        it("test bytes", async()=>{
            const tx = {
                name: "tim"
            }

            const data = await erc1400.sendBytes("0x5553a27edeb7f391ceb7181d3e70095cb54eeca2f6f6540f5bf4c66640599a691a9b8887863c8976ae360ffb7565d7c859f924f77bae4a0bef4656969699226900")
            console.log(data.toString())
        })
    })

  

    

})