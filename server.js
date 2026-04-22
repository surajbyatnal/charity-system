require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { ethers } = require('ethers');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ════════════════════════════════════════════════════
// DATABASE SETUP
// ════════════════════════════════════════════════════

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'charity_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database
async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        username VARCHAR(100),
        total_donated DECIMAL(20, 8) DEFAULT 0,
        donation_count INT DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_wallet (wallet_address)
      )
    `);

    // Create campaigns table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        blockchain_id INT UNIQUE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        charity_address VARCHAR(42) NOT NULL,
        goal_amount DECIMAL(20, 8) NOT NULL,
        raised_amount DECIMAL(20, 8) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        active BOOLEAN DEFAULT TRUE,
        INDEX idx_blockchain_id (blockchain_id),
        INDEX idx_active (active)
      )
    `);

    // Create transactions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        blockchain_id INT UNIQUE,
        donor_address VARCHAR(42) NOT NULL,
        campaign_id INT,
        donation_amount DECIMAL(20, 8) NOT NULL,
        tx_hash VARCHAR(66) NOT NULL,
        message TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        block_number INT,
        tx_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
        INDEX idx_donor (donor_address),
        INDEX idx_tx_hash (tx_hash),
        INDEX idx_status (status),
        INDEX idx_campaign (campaign_id)
      )
    `);

    // Create impact_metrics table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS impact_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id INT NOT NULL,
        metric_name VARCHAR(100),
        metric_value DECIMAL(20, 8),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
        INDEX idx_campaign (campaign_id)
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await connection.release();
  }
}

// ════════════════════════════════════════════════════
// USERS ENDPOINTS
// ════════════════════════════════════════════════════

// Register user
app.post('/api/users/register', async (req, res) => {
  const { walletAddress, username } = req.body;
  
  if (!walletAddress || !username) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const connection = await pool.getConnection();
    const query = 'INSERT INTO users (wallet_address, username) VALUES (?, ?)';
    await connection.execute(query, [walletAddress.toLowerCase(), username]);
    connection.release();

    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Wallet already registered' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
app.get('/api/users/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;

  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM users WHERE wallet_address = ?';
    const [rows] = await connection.execute(query, [walletAddress.toLowerCase()]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user stats
app.put('/api/users/:walletAddress/stats', async (req, res) => {
  const { walletAddress } = req.params;
  const { totalDonated, donationCount } = req.body;

  try {
    const connection = await pool.getConnection();
    const query = `
      UPDATE users 
      SET total_donated = total_donated + ?, 
          donation_count = donation_count + ?
      WHERE wallet_address = ?
    `;
    await connection.execute(query, [totalDonated || 0, donationCount || 0, walletAddress.toLowerCase()]);
    connection.release();

    res.json({ success: true, message: 'User stats updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════
// CAMPAIGNS ENDPOINTS
// ════════════════════════════════════════════════════

// Get all campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM campaigns WHERE active = TRUE ORDER BY created_at DESC';
    const [rows] = await connection.execute(query);
    connection.release();

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign details
app.get('/api/campaigns/:campaignId', async (req, res) => {
  const { campaignId } = req.params;

  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM campaigns WHERE id = ?';
    const [rows] = await connection.execute(query, [campaignId]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create campaign (admin only)
app.post('/api/campaigns', async (req, res) => {
  const { name, category, description, charityAddress, goalAmount } = req.body;

  if (!name || !charityAddress || !goalAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO campaigns (name, category, description, charity_address, goal_amount)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await connection.execute(query, [
      name,
      category || '',
      description || '',
      charityAddress.toLowerCase(),
      goalAmount
    ]);
    connection.release();

    res.json({ success: true, campaignId: result[0].insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════
// TRANSACTIONS ENDPOINTS
// ════════════════════════════════════════════════════

// Record donation transaction
app.post('/api/transactions/record', async (req, res) => {
  const { donorAddress, campaignId, amount, txHash, message, blockNumber } = req.body;

  if (!donorAddress || !campaignId || !amount || !txHash) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO transactions (donor_address, campaign_id, donation_amount, tx_hash, message, status, block_number)
      VALUES (?, ?, ?, ?, ?, 'confirmed', ?)
    `;
    const result = await connection.execute(query, [
      donorAddress.toLowerCase(),
      campaignId,
      amount,
      txHash.toLowerCase(),
      message || '',
      blockNumber || null
    ]);

    // Update campaign raised amount
    const updateCampaignQuery = `
      UPDATE campaigns 
      SET raised_amount = raised_amount + ?
      WHERE id = ?
    `;
    await connection.execute(updateCampaignQuery, [amount, campaignId]);

    // Update user stats
    const updateUserQuery = `
      UPDATE users 
      SET total_donated = total_donated + ?, 
          donation_count = donation_count + 1
      WHERE wallet_address = ?
    `;
    await connection.execute(updateUserQuery, [amount, donorAddress.toLowerCase()]);

    connection.release();

    res.json({ success: true, transactionId: result[0].insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user transactions
app.get('/api/transactions/user/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;

  try {
    const connection = await pool.getConnection();
    const query = `
      SELECT t.*, c.name as campaign_name
      FROM transactions t
      LEFT JOIN campaigns c ON t.campaign_id = c.id
      WHERE t.donor_address = ?
      ORDER BY t.created_at DESC
    `;
    const [rows] = await connection.execute(query, [walletAddress.toLowerCase()]);
    connection.release();

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign transactions
app.get('/api/transactions/campaign/:campaignId', async (req, res) => {
  const { campaignId } = req.params;

  try {
    const connection = await pool.getConnection();
    const query = `
      SELECT * FROM transactions
      WHERE campaign_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await connection.execute(query, [campaignId]);
    connection.release();

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════
// STATISTICS ENDPOINTS
// ════════════════════════════════════════════════════

// Get platform statistics
app.get('/api/stats', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Total donations
    const [donationStats] = await connection.execute(
      'SELECT SUM(donation_amount) as total_donated, COUNT(*) as total_transactions FROM transactions WHERE status = "confirmed"'
    );

    // Total users
    const [userStats] = await connection.execute(
      'SELECT COUNT(*) as total_users FROM users'
    );

    // Active campaigns
    const [campaignStats] = await connection.execute(
      'SELECT COUNT(*) as active_campaigns FROM campaigns WHERE active = TRUE'
    );

    // Campaign progress
    const [campaignProgress] = await connection.execute(
      'SELECT SUM(raised_amount) as total_raised FROM campaigns'
    );

    connection.release();

    res.json({
      totalDonated: donationStats[0].total_donated || 0,
      totalTransactions: donationStats[0].total_transactions || 0,
      totalUsers: userStats[0].total_users || 0,
      activeCampaigns: campaignStats[0].active_campaigns || 0,
      totalRaisedAllCampaigns: campaignProgress[0].total_raised || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard (top donors)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const query = `
      SELECT 
        wallet_address,
        username,
        total_donated,
        donation_count,
        joined_at
      FROM users
      ORDER BY total_donated DESC
      LIMIT 50
    `;
    const [rows] = await connection.execute(query);
    connection.release();

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
