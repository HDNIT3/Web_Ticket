require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const configViewEngine = require('./config/viewEngine');
const initWebRoute = require('./route/AppRouter');
const connectDB = require('./config/configdb');
const cookieParser = require('cookie-parser');
const { initSocket } = require('./config/socket');

require('./config/redis');

const app = express();
const server = http.createServer(app);

const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
    console.log(`[FE Connected] ${req.method} ${req.url}`);
    next();
});

configViewEngine(app);
initWebRoute(app);

// Khởi tạo Socket.io với HTTP Server
initSocket(server, corsOptions);

const startServer = async () => {
    await connectDB();

    if (process.env.NODE_ENV !== 'production') {
        const port = process.env.PORT || 3000;
        server.listen(port, () => {
            console.log(`[Server] Backend đang chạy trên cổng: ${port}`);
        });
    }
};

startServer();

module.exports = app;