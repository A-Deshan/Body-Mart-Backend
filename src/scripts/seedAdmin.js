import { connectDatabase } from '../config/db.js';
import { User } from '../models/User.js';

async function seed() {
  await connectDatabase();

  const existing = await User.findOne({ email: 'admin@bodymart.com' });
  if (existing) {
    console.log('Admin user already exists');
    process.exit(0);
  }

  await User.create({
    name: 'Default Admin',
    email: 'admin@bodymart.com',
    password: 'Admin@12345',
    role: 'admin'
  });

  console.log('Admin user created: admin@bodymart.com / Admin@12345');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
