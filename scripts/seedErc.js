//const { default: Web3 } = require("web3")

const erc1400 = artifacts.require("./ERC1400")


module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts()
    } catch(err) {
        console.log(err)
    }

    callback()
}

