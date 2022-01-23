const ERC1400 = artifacts.require('./ERC1400')

require("chai")
    .use(require("chai-as-promised"))
    .should()


contract('ERC1400', ()=>{

    let erc1400
    let name = "Tangl"
    let symbol = "TAN"
    let decimal = 18

    beforeEach( async()=>{
        erc1400 = await ERC1400.new(name, symbol, decimal)
    })

    //  deployment test

    describe("deployment", ()=>{

        it("deployed the contract", async()=>{

            const contractAddress = erc1400.address 
    
            contractAddress.should.be.not.equal("", "it has a contract address")
    
        })

    })

    // variable initialization when contract loads

    describe("test variable initialization in constructor", ()=>{

        it("has a name", async()=>{

            const tokenName = await erc1400.name()
            tokenName.should.be.equal(name, "the name was initialized at the constructor")

        })

        it("has a symbol", async()=>{

            const tokenSymbol = await erc1400.symbol()
            tokenSymbol.should.be.equal(symbol, "the symbol was initialized at the constructor")

        })


        it("has decimals", async()=>{

            const tokenDecimal = await erc1400.decimal()
            tokenDecimal.toString().should.be.equal(decimal.toString(), "the decimal was initialized at the constructor")

        })

    })

    

})