const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },

    sepolia: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,
        `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
      ),
      network_id: 11155111,
      gas: 5500000,
      gasPrice: 20000000000, // 20 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    polygon_mumbai: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,
        `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
      ),
      network_id: 80001,
      gasPrice: 2000000000, // 2 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },

  mocha: {
    timeout: 40000
  },

  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  db: {
    enabled: false
  }
};
