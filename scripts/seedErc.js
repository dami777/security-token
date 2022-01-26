//const { default: Web3 } = require("web3")

const ERC1400 = artifacts.require("./ERC1400")


module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts()

        // fetch the deployed contract
        const erc1400 = await ERC1400.deployed()


        const issuer = accounts[0]

        // issue tokens to self
        await erc1400.issueTokens(issuer, 10, {from: issuer})

        console.log("token sent to issuer") // token displayed on metamask
    } catch(err) {
        console.log(err)
    }

    callback()
}

