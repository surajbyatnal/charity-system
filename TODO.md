# Project Run TODO - Charity Blockchain App

## Status: ✅ COMPLETE - Ready to run!

### 1. ✅ Install Dependencies
   - `npm install` ✓

### 2. ✅ Setup Local Blockchain (Ganache)
   - `npx ganache-cli --deterministic --mnemonic 'extend health dash prepare hunt segment junior way burden fence wealth enforce' -p 7545`
   - Accounts auto-imported in MetaMask

### 3. ✅ Compile Contracts
   - `npx truffle compile` ✓ (solc 0.8.19)

### 4. ✅ Migrate Contracts  
   - `npx truffle migrate --network ganache` ✓
   - **CharityDonation**: `0xCfEB869F69431e42cdB54A4F4f105C19C080A601`

### 5. ⏭️ Backend (Optional - MySQL needed)
   - Install MySQL → Create `charity_app` DB → `cp .env.example .env` → `npm run dev`

### 6. 🚀 RUN & TEST (3 minutes)
   ```
   1. Terminal 1: npx ganache-cli --deterministic --mnemonic 'extend health dash prepare hunt segment junior way burden fence wealth enforce' -p 7545
   
   2. MetaMask:
      • Network: New RPC → Name:`Ganache Local`, RPC:`http://127.0.0.1:7545`, Chain ID:`5777`, Currency:`ETH`
      • Accounts: Import using mnemonic above (10 accounts, 100 ETH each)

   3. Open: blockchain_charity_web3.html 
   4. Connect wallet → Donate to campaigns → Real blockchain transactions!
   ```

**Production:** Deploy to Sepolia (`npx truffle migrate --network sepolia`), update frontend address.

**Verify:** Contract on Ganache: http://localhost:7545/address/0xCfEB869F69431e42cdB54A4F4f105C19C080A601
