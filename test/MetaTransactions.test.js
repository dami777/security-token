const Cert = artifacts.require("./Certificate")

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract("Cert", ([account1, account2])=>{

    let cert 

    beforeEach(async()=>{
        await cert.new()
    })

})
