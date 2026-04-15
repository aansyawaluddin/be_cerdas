import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { gameSocketHandler } from './sockets/gameHandler.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import pesertaRoutes from './routes/pesertaRoutes.js';
import ledRoutes from './routes/ledRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('io', io);

gameSocketHandler(io);

app.use('/uploads', express.static('public/uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/peserta', pesertaRoutes);
app.use('/api/led', ledRoutes);

app.get('/', (req, res) => {
    res.send('Server Cerdas Cermat Ready!');
});

server.listen(port, () => {
    console.log(`🚀 Server berjalan di http://localhost:${port}`);
    console.log(`🔌 Socket.io siap menerima koneksi real-time`);
});