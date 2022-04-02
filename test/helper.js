const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

const tokens=(n)=>{
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
    
}

const ether = (n) => tokens(n)


const signer  = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"
const fromIsWhiteListedOrIssuer = true
const toIsWhiteListed = true
const signature = "0x9292906193066a70b863da0861b6ea2e366074a455a4c5f6b1a79e7347734e4c72e3b654f028795e7eb8b7762a0be9b249484ac3586f809ba1bc072afe1713191b"
const ethHash = "0xa420c3c01ff29855b5c7421b2a235747e80195ebea4a0eecde39229964686d97"
const data =  web3.eth.abi.encodeParameters(["bytes", "bytes32", "bool", "bool"], [signature, ethHash, fromIsWhiteListedOrIssuer, toIsWhiteListed])

const wait=(seconds)=>{
    const milliseconds= seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const swapState = {

    INVALID: "0",
    OPEN: "1",
    CLOSED: "2",
    EXPIRED:  "3"

}

module.exports = { ETHER_ADDRESS, tokens, signer, data, signature, ethHash, wait, swapState, ether }

