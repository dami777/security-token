const { default: Web3 } = require("web3")

const EIP712 = artifacts.require("./EIP712")
let domain = [
    {name: "name", type: "string"},
    {name: "version", type: "string"},
    {name: "chainId", type: "uint256"},
    {name: "verifyingContract", type: "address"},
    {name: "salt", type: "bytes32"}
]


let identity = [
    {name: "_from", type: "address"},
    {name: "_to", type: "address"},
    {name: "_amount", type: "uint256"}
]


let domainData = {
    name: "Dapp Name",
    version: "1",
    chainId: 5777,
    verifyingContract: certificate.this
}

let message = {
    amount: 100,
    from: "Mr Tommy Shelby",
    to: "Miss Eda Shelby"
}

let data = JSON.stringify({
    types : {
        EIP712Domain: domain,
        Identity: identity
    },

    domain: domainData,
    primaryType: "Identity",
    message: message

})

let signer = "0xa3CfeF02b1D2ecB6aa51B133177Ee29764f25e31"


module.exports = async function(callback) {
    try {
        

        web3.currentProvider.sendAsync(

            {
                method: "eth_signTypedData_v3",
                params: [signer, data],
                from: signer

            },

            (err, result)=>{
                if(err) {
                    console.log(err)
                }

                console.log(result)
            }
        )




        
    } catch(err) {
        console.log(err)
    }

    callback()
}

