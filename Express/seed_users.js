require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user');

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const passwordHash = await bcrypt.hash('123456', 12);

    const admin = await User.findOneAndUpdate(
      { email: 'admin@gmail.com' },
      {
        email: 'admin@gmail.com',
        username: 'admin',
        password: passwordHash,
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        status: 'ACTIVE'
      },
      { upsert: true, new: true }
    );
    console.log('Admin user created/updated:', admin.email);

    const staff = await User.findOneAndUpdate(
      { email: 'staff@gmail.com' },
      {
        email: 'staff@gmail.com',
        username: 'staff',
        password: passwordHash,
        firstName: 'Cinema',
        lastName: 'Staff',
        role: 'STAFF',
        status: 'ACTIVE'
      },
      { upsert: true, new: true }
    );
    console.log('Staff user created/updated:', staff.email);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
