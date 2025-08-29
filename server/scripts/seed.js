const sequelize = require('../config/database');
const { Organization, Table, Checkout } = require('../models');

async function seedDatabase() {
  try {
    console.log('Starting database seed...');
    
    await sequelize.sync({ force: true });
    console.log('Database tables created successfully.');
    
    console.log('Creating sample organizations...');
    const organizations = await Organization.bulkCreate([
      {
        officialName: 'Texas Longhorns Programming Club',
        aliases: ['TLPC', 'Programming Club', 'Texas Programming'],
        category: 'Academic',
        status: 'active',
      },
      {
        officialName: 'Student Government Association',
        aliases: ['SGA', 'Student Government'],
        category: 'Government',
        status: 'active',
      },
      {
        officialName: 'Engineering Student Council',
        aliases: ['ESC', 'Engineering Council'],
        category: 'Academic',
        status: 'active',
      },
      {
        officialName: 'International Students Association',
        aliases: ['ISA', 'International Students'],
        category: 'Cultural',
        status: 'active',
      },
      {
        officialName: 'Texas Kickboxing Club',
        aliases: ['TKB', 'Kickboxing', 'Texas Kickboxing'],
        category: 'Sports',
        status: 'banned',
        banReason: 'Damaged equipment during last event',
        banDate: new Date('2024-01-15'),
      },
    ]);
    
    console.log(`Created ${organizations.length} organizations.`);
    
    console.log('Creating sample tables...');
    const tables = await Table.bulkCreate([
      {
        tableNumber: 'T-001',
        location: 'Main Hall',
        capacity: 8,
        status: 'available',
      },
      {
        tableNumber: 'T-002',
        location: 'Main Hall',
        capacity: 6,
        status: 'available',
      },
      {
        tableNumber: 'T-003',
        location: 'East Wing',
        capacity: 10,
        status: 'available',
      },
      {
        tableNumber: 'T-004',
        location: 'West Wing',
        capacity: 4,
        status: 'available',
      },
      {
        tableNumber: 'T-005',
        location: 'Main Hall',
        capacity: 8,
        status: 'available',
      },
    ]);
    
    console.log(`Created ${tables.length} tables.`);
    
    console.log('Creating sample checkouts...');
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(9, 0, 0, 0);
    
    const checkouts = await Checkout.bulkCreate([
      {
        organizationId: organizations[0].id,
        tableId: tables[0].id,
        checkoutTime: now,
        expectedReturnTime: tomorrow,
        status: 'active',
        checkedOutBy: 'John Smith',
        notes: 'Programming workshop event',
      },
      {
        organizationId: organizations[1].id,
        tableId: tables[2].id,
        checkoutTime: yesterday,
        expectedReturnTime: now,
        status: 'active',
        checkedOutBy: 'Sarah Johnson',
        notes: 'Student government meeting',
      },
    ]);
    
    await tables[0].update({ status: 'checked_out' });
    await tables[2].update({ status: 'checked_out' });
    
    console.log(`Created ${checkouts.length} checkouts.`);
    
    console.log('Database seeded successfully!');
    console.log('\nSummary:');
    console.log(`- Organizations: ${organizations.length}`);
    console.log(`- Tables: ${tables.length}`);
    console.log(`- Active Checkouts: ${checkouts.length}`);
    console.log(`- Available Tables: ${tables.length - checkouts.length}`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;