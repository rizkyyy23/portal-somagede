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
    name: "Oodo",
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

async function seed() {
  try {
    for (const app of initialApps) {
      await db.execute(
        'UPDATE applications SET description = ?, icon = ?, status = ? WHERE code = ?',
        [app.description, app.icon, app.status, app.code]
      );
    }
    console.log('✅ Applications updated/seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
