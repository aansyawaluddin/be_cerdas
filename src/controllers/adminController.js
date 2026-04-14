import { mulaiSiklusPaket, mulaiFaseStrategi } from '../sockets/gameHandler.js';
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

            return res.status(200).json({ success: true, message: "Soal berhasil diperbarui", data: updatedSoal });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    mulaiPaketCerdas: async (req, res) => {
        try {
            const { paketId } = req.params;
            const io = req.app.get('io');
            if (!io) return res.status(500).json({ message: "Socket belum siap." });

            const paket = await prisma.paketSoal.findUnique({ where: { id: parseInt(paketId) } });

            if (paket.babak === 'semi_final' && !paket.nama.toLowerCase().includes('rebutan')) {

                await mulaiFaseStrategi(io, paketId);
                return res.status(200).json({ message: "Fase Strategi 3 Menit dimulai!" });

            } else {
                const soalDimulai = await mulaiSiklusPaket(io, paketId);
                return res.status(200).json({ message: "Game menyala! Menampilkan soal." });
            }

        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
};