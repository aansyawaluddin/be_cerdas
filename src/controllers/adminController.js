import bcrypt from 'bcrypt';
import { mulaiSiklusPaket, mulaiFaseStrategi } from '../sockets/gameHandler.js';
import prisma from '../utils/prisma.js';

export const adminController = {

    createTim: async (req, res) => {
        try {
            const { nama, grup } = req.body;

            if (!nama) {
                return res.status(400).json({ success: false, message: "Nama tim wajib diisi!" });
            }

            const username = nama.toLowerCase().replace(/[^a-z0-9]/g, '');

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("123", salt);

            const fotoTim = req.file ? req.file.filename : null;

            const newTim = await prisma.tim.create({
                data: {
                    nama: nama,
                    username: username,
                    password: hashedPassword,
                    fotoTim: fotoTim,
                    grup: grup ? parseInt(grup) : 1,
                    role: 'peserta'
                }
            });

            return res.status(201).json({
                success: true,
                message: "Tim berhasil didaftarkan!",
                data: {
                    id: newTim.id,
                    nama: newTim.nama,
                    username: newTim.username,
                    grup: newTim.grup,
                    fotoTim: newTim.fotoTim
                }
            });

        } catch (error) {
            console.error("Error create tim:", error);
            if (error.code === 'P2002' && error.meta.target.includes('username')) {
                return res.status(400).json({ success: false, message: "Terjadi bentrok username, silakan coba submit lagi." });
            }
            return res.status(500).json({ success: false, error: error.message });
        }
    },

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
                orderBy: { id: 'asc' },
                select: {
                    id: true,
                    pertanyaan: true,
                    tipe: true,
                    opsiJawaban: true,
                    jawabanBenar: true,
                }
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
    },

    getDashboardLive: async (req, res) => {
        try {
            const soalAktif = await prisma.soal.findFirst({
                where: { status: 'aktif' },
                include: { paketSoal: true }
            });

            let sisaWaktu = 0;
            let targetBabak = 'penyisihan';
            let targetGrup = null;

            if (soalAktif) {
                targetBabak = soalAktif.paketSoal.babak;

                if (soalAktif.waktuMulai) {
                    const selisihDetik = Math.floor((new Date().getTime() - soalAktif.waktuMulai.getTime()) / 1000);
                    sisaWaktu = Math.max(0, 180 - selisihDetik);
                }

                if (targetBabak === 'penyisihan') {
                    const namaPaket = soalAktif.paketSoal.nama.toLowerCase();
                    if (namaPaket.includes('a')) targetGrup = 1;
                    else if (namaPaket.includes('b')) targetGrup = 2;
                    else if (namaPaket.includes('c')) targetGrup = 3;
                    else if (namaPaket.includes('d')) targetGrup = 4;
                }
            }

            const aturanPencarian = {
                role: 'peserta',
                isEliminated: false,
                tahapAktif: targetBabak
            };

            if (targetGrup !== null) {
                aturanPencarian.grup = targetGrup;
            }

            const daftarTim = await prisma.tim.findMany({
                where: aturanPencarian,
                include: { skorBabak: true }
            });

            const leaderboard = daftarTim.map(tim => {
                const skor = tim.skorBabak.find(s => s.babak === tim.tahapAktif);
                return {
                    id: tim.id,
                    nama: tim.nama,
                    poin: skor ? skor.poin : 0
                };
            }).sort((a, b) => b.poin - a.poin);

            return res.status(200).json({
                success: true,
                data: {
                    soalAktif: soalAktif ? {
                        id: soalAktif.id,
                        pertanyaan: soalAktif.pertanyaan,
                        kategori: soalAktif.kategori,
                        paketNama: soalAktif.paketSoal.nama,
                        jawabanBenar: soalAktif.jawabanBenar
                    } : null,
                    sisaWaktuDetik: sisaWaktu,
                    leaderboard: leaderboard
                }
            });

        } catch (error) {
            console.error("Error Get Dashboard Live:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },
};