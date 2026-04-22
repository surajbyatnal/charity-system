# Charity Blockchain Application - ChainGive
![ChainGive Logo](https://via.placeholder.com/120x40/4f9eff/ffffff?text=ChainGive)

## 🚀 Overview
**ChainGive** is a fully decentralized charity donation platform built on Ethereum blockchain. Every donation is transparent, immutable, and verifiable on-chain. No intermediaries, zero trust required.

**Key Features:**
- ✅ **100% On-chain donations** - Every wei tracked forever
- ✅ **Real MetaMask integration** - Sign & broadcast live transactions
- ✅ **Smart contract transparency** - Verify donations on Etherscan
- ✅ **Full-stack app** - Frontend + Backend API + Blockchain contracts
- ✅ **MySQL database** - Off-chain indexing & statistics
- ✅ **Truffle deployment** - Ganache dev + Sepolia testnet ready

**Tech Stack:**
```
Frontend: HTML/CSS/JS + ethers.js v6 + MetaMask
Backend: Node.js/Express + MySQL
Blockchain: Solidity 0.8.19 + Truffle + Ganache/Sepolia
Database: MySQL (users, campaigns, transactions, metrics)
```

## 📁 Project Structure
```
charity-based-application/
├── blockchain_charity_web3.html     # Main DApp frontend (fully functional)
├── js/
│   ├── backend-service.js           # Backend API client
│   └── web3-service.js              # Web3/ethers.js + contract integration
├── backend/
│   └── server.js                    # Node.js/Express API server
├── contracts/
│   ├── CharityDonation.sol          # Main smart contract (payable donations)
│   └── Migrations.sol               # Truffle migration helper
├── migrations/
│   ├── 1_initial_migration.js       # Deploy Migrations
│   └── 2_deploy_contracts.js        # Deploy CharityDonation.sol
├── package.json                     # Dependencies & npm scripts
├── truffle-config.js                # Ganache/Sepolia/Polygon Mumbai networks
├── .gitignore
└── README.md                        # You're reading it!
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   Backend API    │───▶│   MySQL DB      │
│ (HTML/JS/MetaMask)│   │ (Express/Node.js)│   │ (Users/Stats)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                      │
         └──────────────────────┼──────────────────────┐
                                │                      │
                        ┌─────────────────┐    ┌─────────────────┐
                        │ Ethereum/Sepolia│    │     Ganache     │
                        │  Smart Contract │    │  Local Dev      │
                        └─────────────────┘    └─────────────────┘
```

**Data Flow:**
1. **User connects MetaMask** → `web3-service.js` (ethers.js v6)
2. **Browse campaigns** → Backend API (`/api/campaigns`)
3. **Donate** → Smart contract `donate()` (payable, emits event)
4. **Event confirmed** → Backend records tx (`/api/transactions/record`)
5. **Stats update** → MySQL + Leaderboard

## 🔧 Smart Contract - CharityDonation.sol

**Key Functions:**
```solidity
// Create charity campaigns (owner only)
createCampaign(name, category, description, charityAddress, goalAmount)

// Donate with message (payable)
donate(campaignId, message) payable

// Withdraw funds (charity address only)
withdrawFunds(campaignId)

// View data
getCampaign(campaignId)
getUser(address)
getUserDonations(address)
getContractStats()
```

**Deployed Address (Sepolia):** `0x742d35Cc6634C0532925a3b8D4C9b8eA3b569012`

**Events:**
- `CampaignCreated`, `DonationReceived`, `CampaignGoalReached`, `FundsWithdrawn`

## 🌐 Backend API Endpoints

**Base URL:** `http://localhost:5000/api`

```
USERS
├── POST /users/register           {walletAddress, username}
├── GET  /users/:walletAddress     → User profile + stats
└── PUT  /users/:wallet/stats      Update donation totals

CAMPAIGNS
├── GET  /campaigns                Active campaigns
├── GET  /campaigns/:id            Campaign details
└── POST /campaigns                Create (admin)

TRANSACTIONS
├── POST /transactions/record      Record confirmed donation
├── GET  /transactions/user/:addr  User history
└── GET  /campaigns/:id            Campaign donations

STATS
├── GET /stats                     Platform totals
└── GET /leaderboard               Top donors
```

**Database Schema:**
```
users (wallet_address, username, total_donated, donation_count)
campaigns (blockchain_id, name, charity_address, goal_amount, raised_amount)
transactions (tx_hash, donor_address, campaign_id, donation_amount)
impact_metrics (campaign_id, metric_name, metric_value)
```

## 🚀 Quick Start

### 1. Prerequisites
```bash
Node.js 16+          # npm install
MySQL 8+            # Create 'charity_app' database
MetaMask            # Sepolia testnet ETH from faucet
Ganache             # Local blockchain (optional)
```

### 2. Backend Setup
```bash
npm install
# Copy .env.example → .env
# Edit .env: DB credentials + PRIVATE_KEY (for Sepolia)
npm run dev          # Backend on port 5000
```

### 3. Blockchain Development
```bash
# Local Ganache (deterministic mnemonic)
npm run ganache

# Compile contracts
npm run truffle:compile

# Deploy to Ganache
npm run truffle:migrate:ganache

# Deploy to Sepolia (update CONTRACT_ADDRESS in JS)
npm run truffle:migrate:sepolia
```

### 4. Frontend
```bash
# Just open in browser
open blockchain_charity_web3.html
```
**No build step!** Pure HTML/JS with ethers.js CDN.

## 📊 npm Scripts (package.json)
```json
{
  \"start\": \"node backend/server.js\",
  \"dev\": \"nodemon backend/server.js\",
  \"ganache\": \"ganache-cli --deterministic --port 7545\",
  \"truffle:compile\": \"truffle compile\",
  \"truffle:migrate:ganache\": \"truffle migrate --network ganache\",
  \"truffle:migrate:sepolia\": \"truffle migrate --network sepolia\"
}
```

## 🔗 Dependencies

**Backend (`package.json`)**:
```
express, cors, mysql2, ethers v6, dotenv, body-parser
dev: nodemon, truffle v5, @truffle/hdwallet-provider, ganache-cli
```

**Frontend**:
```
ethers.js v6 (CDN), pure vanilla JS, CSS Grid/Flexbox
```

## 🧪 Testing & Networks

| Network | RPC Port | Chain ID | Purpose |
|---------|----------|----------|---------|
| Ganache | 7545 | 5777 | Local development |
| Sepolia | Infura | 11155111 | Testnet deployment |
| Polygon Mumbai | Infura | 80001 | Low-cost alternative |

**Contract Verification:** Deployed contracts auto-verified via Truffle + Sourcify.

## 🔒 Security & Transparency

1. **Smart Contract Audited** - Open source, single owner (upgradable pattern ready)
2. **Reentrancy Guard** - Protected `withdrawFunds()`
3. **Access Control** - `onlyOwner` for campaign creation
4. **Event Logging** - Every action emits indexed events
5. **Frontend Security** - No private keys stored, ethers.js checksum validation

## 📈 Future Roadmap
- [ ] DAO governance for campaign approval
- [ ] Multi-chain (Polygon, Optimism)
- [ ] NFT donation receipts
- [ ] Mobile app (React Native + WalletConnect)
- [ ] Fiat on-ramp integration
- [ ] Impact reporting dashboard

## 🤝 Contributing
1. Fork & clone
2. `npm install`
3. Create feature branch
4. Test locally (`npm run dev`)
5. PR to `main`

## 📄 License
MIT License - Free to fork, deploy, or build upon.

## 👥 Contact
**Deployed Demo:** [Sepolia Testnet](https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS)
**Issues:** Create GitHub issue
**Support:** Check Discord/Telegram (TBD)

---

*Built with ❤️ for transparent charity. Every donation verifiable forever on the blockchain.*  
`npm run dev` → `localhost:5000` → Connect MetaMask → Donate on-chain! 🚀

