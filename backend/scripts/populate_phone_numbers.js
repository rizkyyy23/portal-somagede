import pool from "../config/database.js";

// Generate random Indonesian phone number
function generatePhoneNumber() {
  const prefixes = [
    "0812",
    "0813",
    "0821",
    "0822",
    "0823",
    "0851",
    "0852",
    "0853",
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(10000000 + Math.random() * 90000000); // 8 digit number
  return `${prefix}-${number.toString().slice(0, 4)}-${number.toString().slice(4)}`;
}

async function populatePhoneNumbers() {
  try {
    console.log("Populating phone numbers for users...");

    // Get all users without phone numbers
    const [users] = await pool.query(`
      SELECT id, name, email 
      FROM users 
      WHERE phone IS NULL OR phone = ''
    `);

    if (users.length === 0) {
      console.log("✅ All users already have phone numbers!");
      process.exit(0);
    }

    console.log(`Found ${users.length} users without phone numbers`);

    // Update each user with a random phone number
    for (const user of users) {
      const phoneNumber = generatePhoneNumber();
      await pool.query("UPDATE users SET phone = ? WHERE id = ?", [
        phoneNumber,
        user.id,
      ]);
      console.log(`✓ ${user.name}: ${phoneNumber}`);
    }

    console.log(
      `✅ Successfully added phone numbers to ${users.length} users!`,
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Error populating phone numbers:", error);
    process.exit(1);
  }
}

populatePhoneNumbers();
