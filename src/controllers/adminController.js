import { mulaiSiklusPaket } from '../sockets/gameHandler.js';
import prisma from '../utils/prisma.js';

export const adminController = {
    getPaketSoal: async (req, res) => {
        try {
            const { babak } = req.query;
            const paket = await prisma.paketSoal.findMany({
                where: babak ? { babak: babak } : {},
                orderBy: { nama: 'asc' }
            });
            return res.status(200).json({ success: true, data: paket });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    getSoalByPaket: async (req, res) => {
        try {
            const { paketId } = req.params;
            const soal = await prisma.soal.findMany({
                where: { paketSoalId: parseInt(paketId) },
                orderBy: { id: 'asc' }
            });
            return res.status(200).json({ success: true, data: soal });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    getSoalById: async (req, res) => {
        try {
            const { id } = req.params;
            const soal = await prisma.soal.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    pertanyaan: true,
                    kategori: true,
                    tipe: true,
                    opsiJawaban: true,
                    jawabanBenar: true,
                    poin: true
                }
            });
            if (!soal) {
                return res.status(404).json({ success: false, message: "Soal tidak ditemukan" });
            }
            return res.status(200).json({ success: true, data: soal });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    updateSoal: async (req, res) => {
        try {
            const { id } = req.params;
            const { pertanyaan, kategori, tipe, opsiJawaban, jawabanBenar, poin } = req.body;

            const updatedSoal = await prisma.soal.update({
                where: { id: parseInt(id) },
                data: {
                    pertanyaan,
                    kategori,
                    tipe,
                    opsiJawaban,
                    jawabanBenar,
                    ...(poin && { poin: parseInt(poin) })
                }
            });

            return res.status(200).json({
                success: true,
                message: "Soal berhasil diperbarui",
                data: updatedSoal
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    mulaiPaket: async (req, res) => {
        try {
            const { paketId } = req.params;
            const io = req.app.get('io');

            if (!io) {
                return res.status(500).json({ success: false, message: "Server Real-time belum siap." });
            }

            const soalDimulai = await mulaiSiklusPaket(io, paketId);

            if (!soalDimulai) {
                return res.status(400).json({
                    success: false,
                    message: "Gagal memulai. Semua soal di paket ini sudah selesai."
                });
            }

            return res.status(200).json({
                success: true,
                message: `Mesin otomatis menyala! Menampilkan soal ID ${soalDimulai.id}. Selanjutnya berganti otomatis tiap 3 menit.`,
                data: soalDimulai
            });

        } catch (error) {
            console.error("Error mulai paket:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};