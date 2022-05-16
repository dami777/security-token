const { stringToHex, setToken } = require("./helper")

const ERC1400 = artifacts.require("./ERC1400")

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract ("Partitionless Token", ([tanglAdministrator, reitAdministrator])=>{


    let tanglSecurityToken
    let reitSecurityToken

    let classA = stringToHex("CLASS A")
    let classB = stringToHex("CLASS B")

    
    
    
    let tanglTokenDetails = setToken("TANGL", "TAN", 18, 0, [classA.hex,classB.hex])
    let reitTokenDetails = setToken("Real Estate Investment Trust", "REIT", 18, 0, [classA.hex,classB.hex])


    beforeEach(async()=>{

        tanglSecurityToken = await ERC1400.new(tanglTokenDetails.name, tanglTokenDetails.symbol, tanglTokenDetails.decimal, tanglTokenDetails.totalSupply, {from: tanglAdministrator})
        reitSecurityToken = await ERC1400.new(reitTokenDetails.name, reitTokenDetails.symbol, reitTokenDetails.decimal, reitTokenDetails.totalSupply, {from: reitAdministrator})

    })
})