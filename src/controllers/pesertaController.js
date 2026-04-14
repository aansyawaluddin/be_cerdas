import prisma from '../utils/prisma.js';

export const pesertaController = {
    getSoalAktif: async (req, res) => {
        try {
            const timId = req.user.id; 

            const tim = await prisma.tim.findUnique({ where: { id: timId } });
            if (tim.isEliminated) {
                return res.status(403).json({
                    success: false,
                    message: "Maaf, tim Anda sudah tereliminasi di sesi ini.",
                    isEliminated: true
                });
            }

            const soalAktif = await prisma.soal.findFirst({
                where: { status: 'aktif' },
                select: {
                    id: true,
                    pertanyaan: true,
                    kategori: true,
                    tipe: true,
                    opsiJawaban: true,
                    waktuMulai: true,
                    poin: true
                }
            });

            if (!soalAktif) {
                return res.status(404).json({ success: false, message: "Belum ada soal yang dimulai." });
            }

            const sudahMenjawab = await prisma.riwayatJawaban.findFirst({
                where: { timId: timId, soalId: soalAktif.id }
            });

            if (sudahMenjawab) {
                return res.status(403).json({ success: false, message: "Anda sudah menjawab soal ini. Menunggu soal berikutnya..." });
            }

            const waktuSekarang = new Date();
            const selisihDetik = Math.floor((waktuSekarang.getTime() - soalAktif.waktuMulai.getTime()) / 1000);
            const sisaWaktu = Math.max(0, 180 - selisihDetik);

            return res.status(200).json({
                success: true,
                data: soalAktif,
                sisaWaktuDetik: sisaWaktu
            });

        } catch (error) {
            console.error("Error get soal aktif:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    submitJawaban: async (req, res) => {
        try {
            const timId = req.user.id;
            const { soalId, jawabanTim } = req.body;

            if (!soalId || !jawabanTim) {
                return res.status(400).json({ success: false, message: "Soal ID dan Jawaban wajib dikirim!" });
            }

            const tim = await prisma.tim.findUnique({ where: { id: timId } });
            if (tim.isEliminated) {
                return res.status(403).json({ success: false, message: "Tim Anda sudah tereliminasi." });
            }

            const soal = await prisma.soal.findUnique({ where: { id: parseInt(soalId) } });
            if (!soal || soal.status !== 'aktif') {
                return res.status(400).json({ success: false, message: "Waktu habis atau soal sudah ditutup!" });
            }

            const cekRiwayat = await prisma.riwayatJawaban.findFirst({
                where: { timId: timId, soalId: soal.id }
            });
            if (cekRiwayat) {
                return res.status(400).json({ success: false, message: "Anda sudah menjawab soal ini!" });
            }

            const waktuMenjawab = new Date();
            const durasiMikirMilidetik = waktuMenjawab.getTime() - soal.waktuMulai.getTime();
            const durasiDetik = Math.floor(durasiMikirMilidetik / 1000);

            if (durasiDetik > 180) {
                return res.status(400).json({ success: false, message: "Waktu menjawab sudah habis (lewat 3 menit)." });
            }

            const isBenar = jawabanTim.toString().trim().toLowerCase() === soal.jawabanBenar.trim().toLowerCase();
            let poinDidapat = 0;

            if (isBenar) {
                const pengurangan = Math.floor(durasiDetik / 7);
                poinDidapat = Math.max(0, soal.poin - pengurangan); 
            }

            await prisma.$transaction(async (tx) => {
                await tx.riwayatJawaban.create({
                    data: {
                        timId: timId,
                        soalId: soal.id,
                        jawabanTim: jawabanTim.toString(),
                        isBenar: isBenar,
                        poinDidapat: poinDidapat,
                        waktuMenjawab: waktuMenjawab
                    }
                });

                await tx.skorBabak.upsert({
                    where: {
                        timId_babak: { timId: timId, babak: tim.tahapAktif }
                    },
                    update: {
                        poin: { increment: poinDidapat }
                    },
                    create: {
                        timId: timId,
                        babak: tim.tahapAktif,
                        poin: poinDidapat
                    }
                });
            });


            const io = req.app.get('io');
            if (io) {
                io.emit('update_layar_led', {
                    timId: tim.id,
                    namaSekolah: tim.nama,
                    status: isBenar ? 'BENAR' : 'SALAH',
                    poinTambahan: poinDidapat,
                    waktuDetik: durasiDetik
                });
            }

            return res.status(200).json({
                success: true,
                message: "Jawaban berhasil direkam!",
                data: {
                    isBenar: isBenar,
                    poinDidapat: poinDidapat
                }
            });

        } catch (error) {
            console.error("Error submit jawaban:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};