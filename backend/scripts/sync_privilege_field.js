import pool from "../config/database.js";

const syncPrivilegeField = async () => {
  try {
    console.log("Starting privilege field synchronization...");

    // Step 1: Update has_privilege to 1 for users that have records in user_privileges
    const [updateResult] = await pool.query(`
      UPDATE users u
      SET u.has_privilege = 1
      WHERE u.id IN (SELECT DISTINCT user_id FROM user_privileges)
      AND u.has_privilege = 0
    `);

    console.log(
      `✓ Updated ${updateResult.affectedRows} users to has_privilege = 1`,
    );

    // Step 2: Update has_privilege to 0 for users without privilege records
    const [resetResult] = await pool.query(`
      UPDATE users u
      SET u.has_privilege = 0
      WHERE u.id NOT IN (SELECT DISTINCT user_id FROM user_privileges)
      AND u.has_privilege = 1
    `);

    console.log(
      `✓ Reset ${resetResult.affectedRows} users to has_privilege = 0`,
    );

    // Step 3: Show users with privilege = 1
    const [privilegeUsers] = await pool.query(`
      SELECT u.id, u.name, u.email, u.has_privilege, COUNT(up.id) as app_count
      FROM users u
      LEFT JOIN user_privileges up ON u.id = up.user_id
      WHERE u.has_privilege = 1
      GROUP BY u.id
      ORDER BY u.name
    `);

    console.log(`\n✓ Total users with privilege: ${privilegeUsers.length}`);

    if (privilegeUsers.length > 0) {
      console.log("\nPrivilege Users:");
      privilegeUsers.forEach((user) => {
        console.log(
          `  - ${user.name} (${user.email}) - ${user.app_count} applications`,
        );
      });
    } else {
      console.log("\n⚠ No privilege users found!");
    }

    // Step 4: Detailed privilege report
    const [privilegeReport] = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.role, u.status,
        COUNT(up.id) as app_count,
        GROUP_CONCAT(a.name SEPARATOR ', ') as applications
      FROM users u
      LEFT JOIN user_privileges up ON u.id = up.user_id
      LEFT JOIN applications a ON up.application_id = a.id
      WHERE u.has_privilege = 1
      GROUP BY u.id, u.name, u.email, u.role, u.status
      ORDER BY u.name
    `);

    if (privilegeReport.length > 0) {
      console.log("\n📊 Detailed Privilege Report:");
      privilegeReport.forEach((user) => {
        console.log(`\n  ${user.name} (${user.email})`);
        console.log(`    Role: ${user.role}`);
        console.log(`    Status: ${user.status}`);
        console.log(`    Applications: ${user.applications || "None"}`);
      });
    }

    console.log("\n✅ Synchronization complete!");
  } catch (error) {
    console.error("Error syncing privilege field:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

syncPrivilegeField();
