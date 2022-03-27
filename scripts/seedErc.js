//const { default: Web3 } = require("web3")

const ERC1400 = artifacts.require("./ERC1400")


module.exports = async function(callback) {

    try {

const signer  = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"
const fromIsWhiteListedOrIssuer = true
const toIsWhiteListed = true
const signature = "0x9292906193066a70b863da0861b6ea2e366074a455a4c5f6b1a79e7347734e4c72e3b654f028795e7eb8b7762a0be9b249484ac3586f809ba1bc072afe1713191b"
const ethHash = "0xa420c3c01ff29855b5c7421b2a235747e80195ebea4a0eecde39229964686d97"
const data =  web3.eth.abi.encodeParameters(["bytes", "bytes32", "bool", "bool"], [signature, ethHash, fromIsWhiteListedOrIssuer, toIsWhiteListed])

        let classA = web3.utils.asciiToHex("CLASS A");
        const accounts = await web3.eth.getAccounts()

    

        // fetch the deployed contract
        const erc1400 = await ERC1400.deployed()


        const issuer = accounts[0]

        // issue 1000 tokens to self
        await erc1400.issueByPartition(classA, issuer, 1000, data, {from: issuer})

        console.log("token sent to issuer") // token displayed on metamask
    } catch(err) {
        console.log(err)
    }

    callback()
}

