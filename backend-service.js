// Frontend service to interact with backend API
class BackendService {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // ══════════════════════════════════════════════════
  // USER ENDPOINTS
  // ══════════════════════════════════════════════════

  async registerUser(walletAddress, username) {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, username })
    });
  }

  async getUser(walletAddress) {
    return this.request(`/users/${walletAddress}`);
  }

  async updateUserStats(walletAddress, totalDonated, donationCount) {
    return this.request(`/users/${walletAddress}/stats`, {
      method: 'PUT',
      body: JSON.stringify({ totalDonated, donationCount })
    });
  }

  // ══════════════════════════════════════════════════
  // CAMPAIGNS ENDPOINTS
  // ══════════════════════════════════════════════════

  async getCampaigns() {
    return this.request('/campaigns');
  }

  async getCampaign(campaignId) {
    return this.request(`/campaigns/${campaignId}`);
  }

  async createCampaign(name, category, description, charityAddress, goalAmount) {
    return this.request('/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name,
        category,
        description,
        charityAddress,
        goalAmount
      })
    });
  }

  // ══════════════════════════════════════════════════
  // TRANSACTIONS ENDPOINTS
  // ══════════════════════════════════════════════════

  async recordTransaction(donorAddress, campaignId, amount, txHash, message, blockNumber) {
    return this.request('/transactions/record', {
      method: 'POST',
      body: JSON.stringify({
        donorAddress,
        campaignId,
        amount,
        txHash,
        message,
        blockNumber
      })
    });
  }

  async getUserTransactions(walletAddress) {
    return this.request(`/transactions/user/${walletAddress}`);
  }

  async getCampaignTransactions(campaignId) {
    return this.request(`/transactions/campaign/${campaignId}`);
  }

  // ══════════════════════════════════════════════════
  // STATISTICS ENDPOINTS
  // ══════════════════════════════════════════════════

  async getStats() {
    return this.request('/stats');
  }

  async getLeaderboard() {
    return this.request('/leaderboard');
  }

  async getHealth() {
    return this.request('/health');
  }
}

// Export for use in HTML
const backend = new BackendService();
