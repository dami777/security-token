const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'
const BYTES_0 = "0x0000000000000000000000000000000000000000000000000000000000000000"
const moment = require("moment");
const { ethers } = require("ethers")


//  convert number to wei for token value

const tokens=(n)=>{
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
    
}

const { toBN } = web3.utils

//  convert number to wei for ether value

const ether = (n) => tokens(n)


const signer  = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"
const fromIsWhiteListedOrIssuer = true
const toIsWhiteListed = true
const signature = "0x9292906193066a70b863da0861b6ea2e366074a455a4c5f6b1a79e7347734e4c72e3b654f028795e7eb8b7762a0be9b249484ac3586f809ba1bc072afe1713191b"
const ethHash = "0xa420c3c01ff29855b5c7421b2a235747e80195ebea4a0eecde39229964686d97"
const data =  web3.eth.abi.encodeParameters(["bytes", "bytes32", "bool", "bool"], [signature, ethHash, fromIsWhiteListedOrIssuer, toIsWhiteListed])


//  function to create delay in seconds
const wait=(seconds)=>{
    const milliseconds= seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

//  an object that map numbers to state 
const swapState = {

    INVALID: "0",
    OPEN: "1",
    CLOSED: "2",
    EXPIRED:  "3"

}


//  function to initialize token parameters

const setToken =(name, symbol, decimal, totalSupply, shareClass)=> {

    const result = { name, symbol, decimal, totalSupply, shareClass }

    return result

}



//  function to genere secret Hash

const hashSecret =(secretPhrase)=>{

    const secretHex = stringToHex(secretPhrase).hex
    const dataHex = web3.eth.abi.encodeParameter("bytes32", secretHex)
    const secretHash = ethers.utils.sha256(dataHex)

    //  return the secret phrase and its encoded data
    return { secretHex, secretHash}

}

//  convert string to hex (bytes32)

const stringToHex = (string)=>{

    const hex = web3.utils.asciiToHex(string)
    return { string, hex }

}

//  function to set future expiration
//  the function converts the date to unix time format

const expire=(days)=>{

    return new Date(moment().add(days, 'days').unix()).getTime()

}




//  function to get past expiration
//  the function converts the date to unix time format

const expired=(days)=>{

    return new Date(moment().subtract(days, 'days').unix()).getTime()

}

const reverts = {

    INVALID_CALLER: "invalid caller",
    INVALID_AMOUNT: "invalid amount",
    EXISTING_ID: "existing id",
    INVALID_SECRET: "invalid secret",
    NOT_OPENED: "not opened",
    FUNDED: "funded order",
    NOT_FUNDED: "not funded",
    EXPIRED: "expired order",
    NOT_EXPIRED: "not expired",
    INVALID_ORDER: "invalid order",
    CANT_FUND_EXPIRED_ORDER:"can't fund expired order",
    EXPIRATION_TIME_LESS_THAN_NOW: "expiration time is less than present time",
    FAILED_TO_RELEASE_ETHER: "Failed to release Ether",
    NOT_ISSUABLE: "0x55",
    RESTRICTED: "0x56",
    INVALID_RECEIVER: "0x57",
    INSUFFICIENT_BALANCE: "0x52",
    INSUFFICIENT_ALLOWANCE: "0x53",
    INVALID_TRANSFER_AGENT: "0x58",
    EMPTY_DATA:"DCBE",       //  DCBE : Data Can't Be Empty
    INVALID_SIGNER: "IS",
    USED_SIGNATURE: "US",
    ADDRESS_IS_CONTROLLER:"ACC",
    NOT_CONTROLLABLE: "NC"

}


let domain = [
    {name: "name", type: "string"},
    {name: "version", type: "string"},
    {name: "chainId", type: "uint256"},
    {name: "verifyingContract", type: "address"},
    {name: "salt", type: "bytes32"}
]


let holder = [
    
    {name: "firstName", type: "string"},
    {name: "lastName", type: "string"},
    {name: "location", type: "string"},
    {name: "walletAddress", type: "address"}
]


let transfer = [
    
    {name: "from", type: "Holder"},
    {name: "to", type: "Holder"},
    {name: "amount", type: "uint256"},
    {name: "nonce", type: "uint256"}
]


let types = {

    TransferData: transfer,
    Holder: holder

}


const generateHolder = (firstName, lastName, location, walletAddress) => {

    return {firstName, lastName, location, walletAddress}

}


const certificate= async (from, to, amount, nonce, domainData, signerPrivateKey)=>{

    const message = { from, to, amount, nonce }
    wallet = new ethers.Wallet(signerPrivateKey)
    const signature = await wallet._signTypedData(domainData, types, message)

    const encodedCertificate = web3.eth.abi.encodeParameters([

        "bytes", "bytes32", "uint256",
        {
            "Holder" : {
                "firstName" : "string",
                "lastName" : "string",
                "location" : "string",
                "walletAddress" : "address",
            }
        },

        {
            "Holder" : {
                "firstName" : "string",
                "lastName" : "string",
                "location" : "string",
                "walletAddress" : "address",
            }
        }
    ],

    [signature, domainData.salt, nonce, from, to]

    )

    return encodedCertificate


}


const tanglAdministratorPrivkey = "5a79b29911bdd92ba8693256237f1c8741de68e161531e50d363df7855dcbd7e"
const reitAdministratorPrivKey = "edac872c376d87a61bd0b70f5ab80a2a9814d5d14cdc9c971bc564951cff163e"


module.exports = { 
        ETHER_ADDRESS, tokens, signer, data, signature, ethHash, 
        wait, swapState, ether, BYTES_0, setToken, hashSecret, 
        stringToHex, expire, expired, reverts, toBN, certificate,
        tanglAdministratorPrivkey, reitAdministratorPrivKey
     }

