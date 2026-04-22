var CharityDonation = artifacts.require("CharityDonation");

module.exports = function(deployer) {
  deployer.then(async () => {
    const contract = await CharityDonation.deployed();
    
    // Create initial campaigns
    const campaigns = [
      {
        name: "Clean Water Initiative",
        category: "Humanitarian",
        description: "Funding clean water access in sub-Saharan Africa via transparent on-chain disbursement.",
        charityAddress: "0x742d35Cc6634C0532925a3b8D4C9b8eA3b569012",
        goalAmount: ethers.utils.parseEther("200")
      },
      {
        name: "Reforestation DAO",
        category: "Environment", 
        description: "Plant trees on-chain. Each donation mints a tree NFT tied to a GPS-verified sapling.",
        charityAddress: "0x742d35Cc6634C0532925a3b8D4C9b8eA3b569012",
        goalAmount: ethers.utils.parseEther("150")
      }
    ];

    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      console.log(`Creating campaign ${i+1}: ${campaign.name}`);
      await contract.createCampaign(
        campaign.name,
        campaign.category,
        campaign.description,
        campaign.charityAddress,
        campaign.goalAmount,
        { from: await web3.eth.getAccounts()[0] }
      );
      console.log(`Campaign ${i+1} created!`);
    }
    
    console.log('All campaigns created successfully!');
  });
};
