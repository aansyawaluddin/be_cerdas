import prisma from '../utils/prisma.js';

export const adminController = {
    createTim: async (req, res) => {
        try {
            const { nama, role } = req.body;

            if (!nama) {
                return res.status(400).json({
                    success: false,
                    message: "Nama tim wajib diisi!"
                });
            }

            const timBaru = await prisma.tim.create({
                data: {
                    nama: nama,
                    ...(role && { role: role })
                }
            });

            return res.status(201).json({
                success: true,
                message: "Tim berhasil ditambahkan!",
                data: timBaru
            });

        } catch (error) {
            console.error("Error create tim:", error);

            return res.status(500).json({
                success: false,
                message: "Terjadi kesalahan pada server saat menambahkan tim.",
                error: error.message
            });
        }
    },
};