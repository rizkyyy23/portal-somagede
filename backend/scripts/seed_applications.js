import db from '../config/database.js';

const initialApps = [
  {
    name: "SGI+",
    code: "SGI_PLUS",
    description: "Production Management System",
    icon: "/assets/SGI+.png",
    status: "active"
  },
  {
    name: "Punch",
    code: "PUNCH",
    description: "Attendance & Time Tracking",
    icon: "/assets/punch.png",
    status: "active"
  },
  {
    name: "oodo",
    code: "OODO",
    description: "Warehouse & Inventory Management",
    icon: "/assets/oodo.png",
    status: "active"
  },
  {
    name: "Ops",
    code: "OPS",
    description: "Business Operations Platform",
    icon: "/assets/Ops.png",
    status: "active"
  }
];

try {
  for (const app of initialApps) {
    // Check if exists
    const [rows] = await db.execute('SELECT id FROM applications WHERE code = ?', [app.code]);
    if (rows.length === 0) {
      await db.execute(
        'INSERT INTO applications (name, code, description, icon, status) VALUES (?, ?, ?, ?, ?)',
        [app.name, app.code, app.description, app.icon, app.status]
      );
      console.log(`Added ${app.name}`);
    } else {
      console.log(`${app.name} already exists`);
    }
  }
} catch (error) {
  console.error('Error seeding applications:', error);
} finally {
  process.exit();
}
