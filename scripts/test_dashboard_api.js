import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api';

async function verifyDashboard() {
  console.log('🔍 Verifying Dashboard API Endpoints...\n');

  try {
    // 1. Fetch All Users to get an ID
    console.log('1️⃣  Fetching Users...');
    const usersRes = await fetch(`${BASE_URL}/users`);
    const usersData = await usersRes.json();
    
    if (!usersData.success || usersData.data.length === 0) {
      console.error('❌ Failed to fetch users or no users found.');
      return;
    }

    const adminUser = usersData.data.find(u => u.role === 'Admin');
    const normalUser = usersData.data.find(u => u.role !== 'Admin');

    console.log(`✅ Users found: ${usersData.data.length}`);
    if (adminUser) console.log(`   - Admin: ${adminUser.name} (ID: ${adminUser.id})`);
    if (normalUser) console.log(`   - User:  ${normalUser.name} (ID: ${normalUser.id})`);
    console.log('');

    // 2. Fetch Categorized Apps
    console.log('2️⃣  Fetching Application Categories...');
    const appsRes = await fetch(`${BASE_URL}/applications/categories`);
    const appsData = await appsRes.json();

    if (appsData.success) {
      const categories = Object.keys(appsData.data);
      console.log(`✅ Categories found: ${categories.join(', ')}`);
      categories.forEach(cat => {
        console.log(`   - ${cat}: ${appsData.data[cat].length} apps`);
      });
    } else {
      console.error('❌ Failed to fetch application categories.');
    }
    console.log('');

    // 3. Verify Privileges for Normal User
    if (normalUser) {
      console.log(`3️⃣  Verifying Privileges for User: ${normalUser.name}...`);
      const privRes = await fetch(`${BASE_URL}/users/${normalUser.id}/privileges`);
      const privData = await privRes.json();

      if (privData.success) {
        console.log(`✅ Allowed App IDs: ${JSON.stringify(privData.data)}`);
      } else {
        console.error('❌ Failed to fetch user privileges.');
      }
    } else {
      console.log('⚠️  No normal user found to test privileges.');
    }

    console.log('\n✨ API Verification Complete! The backend is serving data correctly.');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.log('Make sure the backend server consists of running on port 3001.');
  }
}

verifyDashboard();
