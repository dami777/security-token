//require("babel-polyfill");
//require("babel-register");  // set us the connfig for es6 features
//require("dotenv").config();
const HDWalletProvider = require('truffle-hdwallet-provider-privkey')

const PRIVATE_KEY = "0ea72244b1016e8f60111f88297d7132f12159397c53f9fb5d3711ca3591fa57" // process.env.PRIVATE_KEY
const API_URL = "https://eth-rinkeby.alchemyapi.io/v2/3BSBZyCvsYxhf_NiYhy2uoGUtc-oy9kP" //process.env.API_URL


module.exports = {
 

  networks: {
    development: {
      host: "127.0.0.1",
      port: "8545",
      network_id:"*"
    },

    rinkeby: {
      provider: function() {
        return new HDWalletProvider(
          //private key
          [PRIVATE_KEY],
          //url to an ethereum node
          API_URL
        )
      },

      network_id: 4,
      networkCheckTimeout: 1000000
   }
  },

  contracts_directory: "./contracts",
  contracts_build_directory: "./abis",

  // Set default mocha options here, use special reporters etc.
  mocha: {
    timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.10",
      optimizer: {
        enable: true,
        runs: 200
      }
    }
  },

  // Truffle DB is currently disabled by default; to enable it, change enabled:
  // false to enabled: true. The default storage location can also be
  // overridden by specifying the adapter settings, as shown in the commented code below.
  //
  // NOTE: It is not possible to migrate your contracts to truffle DB and you should
  // make a backup of your artifacts to a safe location before enabling this feature.
  //
  // After you backed up your artifacts you can utilize db by running migrate as follows: 
  // $ truffle migrate --reset --compile-all
  //
  // db: {
    // enabled: false,
    // host: "127.0.0.1",
    // adapter: {
    //   name: "sqlite",
    //   settings: {
    //     directory: ".db"
    //   }
    // }
  // }
};
