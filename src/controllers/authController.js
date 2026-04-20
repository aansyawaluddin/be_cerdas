import prisma from '../utils/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const authController = {
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ success: false, message: "Username dan password wajib diisi!" });
            }

            const user = await prisma.tim.findUnique({
                where: { username: username }
            });

            if (!user) {
                return res.status(404).json({ success: false, message: "Akun tidak ditemukan!" });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: "Password salah!" });
            }

            const rahasiaKey = process.env.JWT_SECRET || 'rahasia_cerdas_cermat_2026';
            const token = jwt.sign(
                { id: user.id, role: user.role },
                rahasiaKey,
                { expiresIn: '1d' }
            );

            return res.status(200).json({
                success: true,
                role: user.role,
                message: "Login berhasil!",
                token: token
            });

        } catch (error) {
            console.error("Error login:", error);
            return res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
        }
    },

    logout: async (req, res) => {
        try {
            return res.status(200).json({
                success: true,
                message: "Logout berhasil!"
            });
        } catch (error) {
            console.error("Error logout:", error);
            return res.status(500).json({ success: false, message: "Terjadi kesalahan server saat logout." });
        }
    }
};