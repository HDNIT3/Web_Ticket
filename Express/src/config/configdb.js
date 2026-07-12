require('dotenv').config();

const mongoose = require('mongoose');

const REQUIRED_INDEXES = [
    {
        collection: 'users',
        field: { username: 1 },
        options: { unique: true, sparse: true, name: 'username_1' },
    },
    {
        collection: 'users',
        field: { email: 1 },
        options: { unique: true, sparse: true, name: 'email_1' },
    },
    {
        collection: 'users',
        field: { phoneNumber: 1 },
        options: { unique: true, sparse: true, name: 'phoneNumber_1' },
    },
    {
        collection: 'genres',
        field: { name: 1 },
        options: { unique: true, name: 'name_1' },
    },
    {
        collection: 'movies',
        field: { title: 1 },
        options: { unique: true, name: 'title_1' },
    },
];

const syncRequiredIndexes = async () => {
    const db = mongoose.connection.db;

    for (const { collection, field, options } of REQUIRED_INDEXES) {
        try {
            await db.collection(collection).dropIndex(options.name);
        } catch {
        }

        try {
            await db.collection(collection).createIndex(field, options);
        } catch (err) {
            console.error(`[DB] Không thể tạo index ${options.name}:`, err.message);
        }
    }
};

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('Lỗi kết nối MongoDB: MONGO_URI không được định nghĩa trong biến môi trường.');
        }

        await mongoose.connect(mongoUri);
        console.log('Kết nối MongoDB thành công');

        await syncRequiredIndexes();
    } catch (error) {
        console.error('Lỗi kết nối MongoDB:', error);
        throw error;
    }
};

module.exports = connectDB;