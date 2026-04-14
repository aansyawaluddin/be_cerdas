import prisma from '../utils/prisma.js';

export const pesertaController = {
    getSoalStrategi: async (req, res) => {
        try {
            const { paketId } = req.params;
            const soalStrategi = await prisma.soal.findMany({
                where: { paketSoalId: parseInt(paketId) },
                select: { id: true, kategori: true },
                orderBy: { id: 'asc' }
            });
            return res.status(200).json({ success: true, data: soalStrategi });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    submitStrategi: async (req, res) => {
        try {
            const timId = req.user.id;
            const { daftarTaruhan } = req.body;

            if (!Array.isArray(daftarTaruhan) || daftarTaruhan.length !== 10) {
                return res.status(400).json({ success: false, message: "Harus memasukkan taruhan untuk tepat 10 soal!" });
            }

            let totalPoin = 0;
            for (const taruhan of daftarTaruhan) {
                if (taruhan.poin < 10 || taruhan.poin > 100) {
                    return res.status(400).json({ success: false, message: "Poin tiap soal harus 10 - 100!" });
                }
                totalPoin += taruhan.poin;
            }

            if (totalPoin > 200) {
                return res.status(400).json({ success: false, message: `Total poin melebihi 200! (Total: ${totalPoin})` });
            }

            const dataInsert = daftarTaruhan.map(t => ({
                timId: timId,
                soalId: t.soalId,
                poin: t.poin
            }));

            await prisma.$transaction([
                prisma.taruhanSoal.deleteMany({
                    where: { timId: timId, soalId: { in: daftarTaruhan.map(t => t.soalId) } }
                }),
                prisma.taruhanSoal.createMany({ data: dataInsert })
            ]);

            return res.status(200).json({ success: true, message: "Strategi taruhan berhasil disimpan!" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    getSoalAktif: async (req, res) => {
        try {
            const timId = req.user.id;
            const tim = await prisma.tim.findUnique({ where: { id: timId } });

            if (tim.isEliminated) {
                return res.status(403).json({ success: false, message: "Tim tereliminasi.", isEliminated: true });
            }

            const soalAktif = await prisma.soal.findFirst({
                where: { status: 'aktif' },
                select: {
                    id: true, pertanyaan: true, kategori: true, tipe: true,
                    opsiJawaban: true, waktuMulai: true, poin: true
                }
            });

            if (!soalAktif) return res.status(404).json({ success: false, message: "Belum ada soal dimulai." });

            const sudahMenjawab = await prisma.riwayatJawaban.findFirst({
                where: { timId: timId, soalId: soalAktif.id }
            });

            if (sudahMenjawab) {
                return res.status(403).json({ success: false, message: "Anda sudah menjawab soal ini." });
            }

            const sisaWaktu = Math.max(0, 180 - Math.floor((new Date().getTime() - soalAktif.waktuMulai.getTime()) / 1000));

            return res.status(200).json({ success: true, data: soalAktif, sisaWaktuDetik: sisaWaktu });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    submitJawaban: async (req, res) => {
        try {
            const timId = req.user.id;
            const { soalId, jawabanTim } = req.body;

            if (!soalId || !jawabanTim) return res.status(400).json({ success: false, message: "Data tidak lengkap!" });

            const tim = await prisma.tim.findUnique({ where: { id: timId } });
            if (tim.isEliminated) return res.status(403).json({ success: false, message: "Tim tereliminasi." });

            const soal = await prisma.soal.findUnique({ where: { id: parseInt(soalId) }, include: { paketSoal: true } });
            if (!soal || soal.status !== 'aktif') return res.status(400).json({ success: false, message: "Soal ditutup!" });

            const cekRiwayat = await prisma.riwayatJawaban.findFirst({ where: { timId: timId, soalId: soal.id } });
            if (cekRiwayat) return res.status(400).json({ success: false, message: "Anda sudah menjawab!" });

            const durasiDetik = Math.floor((new Date().getTime() - soal.waktuMulai.getTime()) / 1000);
            if (durasiDetik > 180) return res.status(400).json({ success: false, message: "Waktu habis." });

            const isBenar = jawabanTim.toString().trim().toLowerCase() === soal.jawabanBenar.trim().toLowerCase();
            let poinDidapat = 0;

            if (tim.tahapAktif === 'penyisihan') {
                if (isBenar) poinDidapat = Math.max(0, soal.poin - Math.floor(durasiDetik / 7));
            } else if (tim.tahapAktif === 'semi_final') {
                if (soal.paketSoal.nama.toLowerCase().includes("rebutan")) {
                    poinDidapat = isBenar ? 20 : 0;
                } else {
                    const taruhan = await prisma.taruhanSoal.findUnique({
                        where: { timId_soalId: { timId: tim.id, soalId: soal.id } }
                    });
                    const nilaiTaruhan = taruhan ? taruhan.poin : 10;
                    poinDidapat = isBenar ? nilaiTaruhan : -nilaiTaruhan;
                }
            }

            await prisma.$transaction(async (tx) => {
                await tx.riwayatJawaban.create({
                    data: {
                        timId: timId, soalId: soal.id, jawabanTim: jawabanTim.toString(),
                        isBenar: isBenar, poinDidapat: poinDidapat
                    }
                });
                await tx.skorBabak.upsert({
                    where: { timId_babak: { timId: timId, babak: tim.tahapAktif } },
                    update: { poin: { increment: poinDidapat } },
                    create: { timId: timId, babak: tim.tahapAktif, poin: poinDidapat }
                });
            });

            const io = req.app.get('io');
            if (io) {
                io.emit('update_layar_led', {
                    timId: tim.id, namaSekolah: tim.nama, status: isBenar ? 'BENAR' : 'SALAH',
                    poinTambahan: poinDidapat, waktuDetik: durasiDetik
                });
            }

            return res.status(200).json({ success: true, data: { isBenar, poinDidapat } });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};