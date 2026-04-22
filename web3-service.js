// Updated Web3 configuration - integrate backend
const BACKEND_URL = 'http://localhost:5000/api';
const CONTRACT_ADDRESS = '0xCfEB869F69431e42cdB54A4F4f105C19C080A601'; // Deployed on Ganache local

const CONTRACT_ABI = [
  // donate(uint256 campaignId, string memory message) payable
  {
    "inputs": [
      {"internalType":"uint256","name":"_campaignId","type":"uint256"},
      {"internalType":"string","name":"_message","type":"string"}
    ],
    "name": "donate",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // registerUser(string username)
  {
    "inputs": [{"internalType":"string","name":"_username","type":"string"}],
    "name": "registerUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Event: DonationReceived
  {
    "anonymous": false,
    "inputs": [
      {"indexed":true,"name":"donationId","type":"uint256"},
      {"indexed":true,"name":"campaignId","type":"uint256"},
      {"indexed":true,"name":"donor","type":"address"},
      {"indexed":false,"name":"amount","type":"uint256"},
      {"indexed":false,"name":"message","type":"string"},
      {"indexed":false,"name":"timestamp","type":"uint256"}
    ],
    "name": "DonationReceived",
    "type": "event"
  },
  // getContractStats
  {
    "inputs": [],
    "name": "getContractStats",
    "outputs": [
      {"internalType":"uint256","name":"_totalDonations","type":"uint256"},
      {"internalType":"uint256","name":"_totalDonors","type":"uint256"},
      {"internalType":"uint256","name":"_activeCampaigns","type":"uint256"},
      {"internalType":"uint256","name":"_contractBalance","type":"uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // getUserDonations
  {
    "inputs": [{"internalType":"address","name":"_userAddress","type":"address"}],
    "name": "getUserDonations",
    "outputs": [{"internalType":"uint256[]","name":"","type":"uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  // getUser
  {
    "inputs": [{"internalType":"address","name":"_userAddress","type":"address"}],
    "name": "getUser",
    "outputs": [
      {"internalType":"address","name":"walletAddress","type":"address"},
      {"internalType":"string","name":"username","type":"string"},
      {"internalType":"uint256","name":"totalDonated","type":"uint256"},
      {"internalType":"uint256","name":"donationCount","type":"uint256"},
      {"internalType":"uint256","name":"joinedAt","type":"uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // getCampaign
  {
    "inputs": [{"internalType":"uint256","name":"_campaignId","type":"uint256"}],
    "name": "getCampaign",
    "outputs": [
      {"internalType":"uint256","name":"id","type":"uint256"},
      {"internalType":"string","name":"name","type":"string"},
      {"internalType":"string","name":"category","type":"string"},
      {"internalType":"string","name":"description","type":"string"},
      {"internalType":"address","name":"charityAddress","type":"address"},
      {"internalType":"uint256","name":"goalAmount","type":"uint256"},
      {"internalType":"uint256","name":"raisedAmount","type":"uint256"},
      {"internalType":"uint256","name":"createdAt","type":"uint256"},
      {"internalType":"bool","name":"active","type":"bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ════════════════════════════════════════════════════
// WEB3 & BACKEND SERVICE UTILITIES
// ════════════════════════════════════════════════════

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.userAddress = null;
    this.sessionDonations = [];
    this.totalDonated = 0;
    this.totalGas = 0;
  }

  async connectWallet() {
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask.');
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      await this.provider.send('eth_requestAccounts', []);
      this.signer = await this.provider.getSigner();
      this.userAddress = await this.signer.getAddress();
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);

      // Register user in backend
      await this.registerUserInBackend();

      return this.userAddress;
    } catch (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  async registerUserInBackend() {
    try {
      const response = await fetch(`${BACKEND_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: this.userAddress,
          username: this.userAddress.slice(0, 6) + '...' + this.userAddress.slice(-4)
        })
      });

      if (!response.ok && response.status !== 409) {
        console.warn('Failed to register user in backend');
      }
    } catch (error) {
      console.warn('Backend registration failed:', error);
    }
  }

  async donate(campaignId, amount, message) {
    if (!this.signer || !this.contract) {
      throw new Error('Wallet not connected');
    }

    try {
      const valueWei = ethers.parseEther(amount.toString());

      // Call smart contract
      const tx = await this.contract.donate(campaignId, message || '', { value: valueWei });

      // Record in backend
      const donation = {
        hash: tx.hash,
        campaignId,
        amount,
        message,
        timestamp: new Date(),
        status: 'pending'
      };

      this.sessionDonations.unshift(donation);

      // Wait for confirmation
      const receipt = await tx.wait(1);

      if (receipt.status === 1) {
        donation.status = 'confirmed';
        donation.blockNumber = receipt.blockNumber;

        // Update backend database
        await this.recordTransactionInBackend(
          this.userAddress,
          campaignId,
          amount,
          tx.hash,
          message,
          receipt.blockNumber
        );

        this.totalDonated += parseFloat(amount);
        this.totalGas += parseFloat(ethers.formatEther(receipt.gasUsed * receipt.gasPrice || 0n));
      } else {
        donation.status = 'failed';
      }

      return donation;
    } catch (error) {
      throw new Error(`Donation failed: ${error.message}`);
    }
  }

  async recordTransactionInBackend(donor, campaignId, amount, txHash, message, blockNumber) {
    try {
      const response = await fetch(`${BACKEND_URL}/transactions/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorAddress: donor,
          campaignId,
          amount,
          txHash,
          message,
          blockNumber
        })
      });

      if (!response.ok) {
        console.warn('Failed to record transaction in backend');
      }
    } catch (error) {
      console.warn('Backend transaction recording failed:', error);
    }
  }

  async getCampaigns() {
    try {
      const response = await fetch(`${BACKEND_URL}/campaigns`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      return [];
    }
  }

  async getStats() {
    try {
      const response = await fetch(`${BACKEND_URL}/stats`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return null;
    }
  }

  async getUserTransactions(walletAddress) {
    try {
      const response = await fetch(`${BACKEND_URL}/transactions/user/${walletAddress}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user transactions:', error);
      return [];
    }
  }

  async getChainData() {
    if (!this.provider) return null;

    try {
      const blockNum = await this.provider.getBlockNumber();
      const feeData = await this.provider.getFeeData();
      const balance = await this.provider.getBalance(this.userAddress);

      return {
        blockNumber: blockNum,
        gasPrice: feeData.gasPrice,
        balance: ethers.formatEther(balance),
        chainId: (await this.provider.getNetwork()).chainId
      };
    } catch (error) {
      console.error('Failed to get chain data:', error);
      return null;
    }
  }
}

// Global Web3 Service instance
const web3Service = new Web3Service();

// Export for frontend integration
window.web3Service = web3Service;
window.BACKEND_URL = BACKEND_URL;
