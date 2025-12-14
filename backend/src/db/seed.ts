import pool from '../config/database';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seed...');

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await client.query(`
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@vyomaa.com', hashedPassword, 'Admin User']);

    console.log('✓ Created default admin user');
    console.log('  Email: admin@vyomaa.com');
    console.log('  Password: admin123');
    console.log('  ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding error:', error);
      process.exit(1);
    });
}

export default seedDatabase;
