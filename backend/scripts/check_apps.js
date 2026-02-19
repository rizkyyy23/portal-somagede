import pool from "../config/database.js";

async function checkApplications() {
  try {
    // Total applications
    const [totalApps] = await pool.query(
      "SELECT COUNT(*) as count FROM applications",
    );
    console.log(`\n📊 Total Applications: ${totalApps[0].count}`);

    // Active applications
    const [activeApps] = await pool.query(
      "SELECT COUNT(*) as count FROM applications WHERE status = 'active'",
    );
    console.log(`✅ Active Applications: ${activeApps[0].count}`);

    // Inactive applications
    const [inactiveApps] = await pool.query(
      "SELECT COUNT(*) as count FROM applications WHERE status = 'inactive'",
    );
    console.log(`❌ Inactive Applications: ${inactiveApps[0].count}`);

    // List all applications with their status
    const [apps] = await pool.query(
      "SELECT id, name, code, status FROM applications ORDER BY id",
    );
    console.log(`\n📋 Application List:`);
    console.log("─".repeat(80));
    apps.forEach((app) => {
      const statusIcon = app.status === "active" ? "✅" : "❌";
      console.log(
        `${statusIcon} ID: ${app.id.toString().padStart(2)} | ${app.name.padEnd(25)} | ${app.code.padEnd(10)} | Status: ${app.status}`,
      );
    });
    console.log("─".repeat(80));

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkApplications();
