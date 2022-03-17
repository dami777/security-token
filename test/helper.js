const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

const tokens=(n)=>{
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
    
}


const signer  = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"
let fromIsWhiteListedOrIssuer = true
let toIsWhiteListed = true
const data =  web3.eth.abi.encodeParameters(["bytes", "bytes32", "bool", "bool"], [signature, ethHash, fromIsWhiteListedOrIssuer, toIsWhiteListed])


module.exports = { ETHER_ADDRESS, tokens, signer, data }

