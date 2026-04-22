import prisma from '../utils/prisma.js';
import { getGameState } from '../sockets/gameHandler.js';

export const pesertaController = {

    getInformasiTim: async (req, res) => {
        try {
            const timId = req.user.id;

            const tim = await prisma.tim.findUnique({
                where: { id: timId },
                select: {
                    fotoTim: true,
                    nama: true,
                    grup: true,
                    tahapAktif: true 
                }
            });

            if (!tim) {
                return res.status(404).json({ success: false, message: "Tim tidak ditemukan!" });
            }

            return res.status(200).json({
                success: true,
                data: {
                    nama: tim.nama,
                    grup: tim.grup,
                    foto: tim.fotoTim,
                    tahap: tim.tahapAktif
                }
            });

        } catch (error) {
            console.error("Error Get Informasi Tim:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },
    getSoalStrategi: async (req, res) => {
        try {
            const { paketId } = req.params;
            const gameState = getGameState();

            if (gameState.faseAktif !== 'strategi') {
                return res.status(403).json({ success: false, message: "Akses ditolak! Saat ini bukan sesi penyusunan strategi." });
            }
            if (parseInt(paketId) !== parseInt(gameState.paketAktifId)) {
                return res.status(403).json({ success: false, message: "Akses ditolak! Anda mencoba mengakses paket soal yang salah." });
            }

            const soalStrategi = await prisma.soal.findMany({
                where: { paketSoalId: parseInt(paketId) },
                select: { id: true, kategori: true },
                orderBy: { id: 'asc' }
            });

            return res.status(200).json({ success: true, sisaWaktuDetik: gameState.sisaWaktu, data: soalStrategi });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    submitStrategi: async (req, res) => {
        try {
            const timId = req.user.id;
            const { daftarTaruhan } = req.body;
            const gameState = getGameState();

            if (gameState.faseAktif !== 'strategi') return res.status(403).json({ success: false, message: "Bukan waktu menyusun strategi." });
            if (gameState.isPaused) return res.status(403).json({ success: false, message: "Game sedang di-jeda (Paused)." });
            if (!Array.isArray(daftarTaruhan) || daftarTaruhan.length !== 10) return res.status(400).json({ success: false, message: "Harus tepat 10 soal!" });

            let totalPoin = 0;
            for (const taruhan of daftarTaruhan) {
                if (taruhan.poin < 10 || taruhan.poin > 100) return res.status(400).json({ success: false, message: "Poin harus 10-100!" });
                totalPoin += taruhan.poin;
            }
            if (totalPoin > 200) return res.status(400).json({ success: false, message: "Total poin melebihi 200!" });

            const dataInsert = daftarTaruhan.map(t => ({ timId: timId, soalId: t.soalId, poin: t.poin }));
            await prisma.$transaction([
                prisma.taruhanSoal.deleteMany({ where: { timId: timId, soalId: { in: daftarTaruhan.map(t => t.soalId) } } }),
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

            if (tim.isEliminated) return res.status(403).json({ success: false, message: "Tim tereliminasi.", isEliminated: true });

            const soalAktif = await prisma.soal.findFirst({
                where: { status: 'aktif' },
                select: {
                    id: true,
                    pertanyaan: true,
                    foto: true,
                    kategori: true,
                    tipe: true,
                    opsiJawaban: true,
                    waktuMulai: true,
                    poin: true
                }
            });

            if (!soalAktif) return res.status(404).json({ success: false, message: "Belum ada soal dimulai." });

            const riwayat = await prisma.riwayatJawaban.findFirst({ where: { timId: timId, soalId: soalAktif.id } });
            let sisaWaktu = 0;
            const gameState = getGameState();
            const DURASI = parseInt(process.env.DURASI_SOAL) || 180;

            if (gameState.soalAktifId === soalAktif.id) {
                sisaWaktu = gameState.sisaWaktu;
            } else {
                sisaWaktu = Math.max(0, DURASI - Math.floor((new Date().getTime() - soalAktif.waktuMulai?.getTime()) / 1000));
            }

            let dataSoalAman = { ...soalAktif };

            if (soalAktif.tipe === 'memori') {
                if (gameState.faseAktif === 'memori_gambar') {
                    dataSoalAman.pertanyaan = "Amati gambar berikut dengan saksama!";
                    dataSoalAman.opsiJawaban = null;
                }
                else if (gameState.faseAktif === 'memori_jeda') {
                    dataSoalAman.foto = null;
                    dataSoalAman.pertanyaan = "Waktu habis! Bersiaplah, pertanyaan akan segera muncul...";
                    dataSoalAman.opsiJawaban = null;
                }
                else if (gameState.faseAktif === 'soal') {
                    dataSoalAman.foto = null;
                }
            }

            return res.status(200).json({
                success: true,
                data: dataSoalAman,
                sisaWaktuDetik: sisaWaktu,
                isPaused: gameState.isPaused,
                sudahMenjawab: !!riwayat,
                timPencetBelId: gameState.timPencetBelId,
                faseAktif: gameState.faseAktif
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    tekanBel: async (req, res) => {
        try {
            const timId = req.user.id;
            const io = req.app.get('io');
            const gameState = getGameState();

            if (gameState.faseAktif !== 'soal' || !gameState.soalAktifId) {
                return res.status(400).json({ success: false, message: "Bukan waktunya memencet bel!" });
            }
            if (gameState.isPaused) {
                return res.status(403).json({ success: false, message: "Game sedang di-pause!" });
            }

            const { prosesTekanBel } = await import('../sockets/gameHandler.js');
            const berhasil = prosesTekanBel(io, timId);

            if (berhasil) {
                return res.status(200).json({ success: true, message: "Berhasil! Silakan pilih jawaban." });
            } else {
                return res.status(400).json({ success: false, message: "Kalah cepat! Tim lain sudah memencet bel." });
            }
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

            const gameState = getGameState();

            if (gameState.faseAktif === 'memori_gambar' || gameState.faseAktif === 'memori_jeda') {
                return res.status(403).json({
                    success: false,
                    message: "Sabar! Belum waktunya menjawab. Perhatikan soal baik-baik."
                });
            }

            const soal = await prisma.soal.findUnique({ where: { id: parseInt(soalId) }, include: { paketSoal: true } });
            if (!soal || soal.status !== 'aktif') return res.status(400).json({ success: false, message: "Soal ditutup!" });

            const cekRiwayat = await prisma.riwayatJawaban.findFirst({ where: { timId: timId, soalId: soal.id } });
            if (cekRiwayat) return res.status(400).json({ success: false, message: "Anda sudah menjawab!" });

            let durasiDetik = 0;
            const DURASI = parseInt(process.env.DURASI_SOAL) || 180;

            if (gameState.isPaused) return res.status(403).json({ success: false, message: "Tahan! Game sedang di-jeda." });

            if (gameState.soalAktifId === soal.id) {
                if (gameState.sisaWaktu <= 0) return res.status(400).json({ success: false, message: "Waktu habis." });
                durasiDetik = DURASI - gameState.sisaWaktu;
            } else {
                durasiDetik = Math.floor((new Date().getTime() - soal.waktuMulai.getTime()) / 1000);
                if (durasiDetik > DURASI) return res.status(400).json({ success: false, message: "Waktu habis." });
            }

            const isBenar = jawabanTim.toString().trim().toLowerCase() === soal.jawabanBenar.trim().toLowerCase();
            let poinDidapat = 0;

            if (tim.tahapAktif === 'penyisihan') {
                if (isBenar) {
                    const jumlahBenarSebelumnya = await prisma.riwayatJawaban.count({ where: { soalId: soal.id, isBenar: true } });
                    const poinPeringkat = [25, 23, 21, 19, 17, 14, 12, 10, 8, 6, 4, 2];
                    poinDidapat = poinPeringkat[jumlahBenarSebelumnya] || 0;
                }
            }
            else if (tim.tahapAktif === 'semi_final') {
                if (soal.paketSoal.nama.toLowerCase().includes("rebutan")) {
                    if (gameState.timPencetBelId !== tim.id) {
                        return res.status(403).json({ success: false, message: "Hanya pemegang bel yang bisa menjawab!" });
                    }

                    poinDidapat = isBenar ? 20 : 0;

                    const { selesaikanSoalSekarang } = await import('../sockets/gameHandler.js');
                    selesaikanSoalSekarang(req.app.get('io'), soal.paketSoalId);

                } else {
                    const taruhan = await prisma.taruhanSoal.findUnique({ where: { timId_soalId: { timId: tim.id, soalId: soal.id } } });
                    const nilaiTaruhan = taruhan ? taruhan.poin : 10;
                    poinDidapat = isBenar ? nilaiTaruhan : -nilaiTaruhan;
                }
            }

            await prisma.$transaction(async (tx) => {
                await tx.riwayatJawaban.create({
                    data: { timId: timId, soalId: soal.id, jawabanTim: jawabanTim.toString(), isBenar: isBenar, poinDidapat: poinDidapat }
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
    },

    getLeaderboardTahapAktif: async (req, res) => {
        try {
            const timId = req.user.id;

            const timSaya = await prisma.tim.findUnique({
                where: { id: timId },
                select: { id: true, nama: true, grup: true, tahapAktif: true }
            });

            if (!timSaya) return res.status(404).json({ success: false, message: "Tim tidak ditemukan" });

            const daftarTim = await prisma.tim.findMany({
                where: {
                    role: 'peserta',
                    tahapAktif: timSaya.tahapAktif,
                    grup: timSaya.grup
                },
                select: {
                    id: true,
                    nama: true,
                    grup: true,
                    fotoTim: true,
                    isEliminated: true,
                    skorBabak: {
                        where: { babak: timSaya.tahapAktif },
                        select: { poin: true }
                    }
                }
            });

            const timDenganSkor = daftarTim.map(tim => {
                const poinSaatIni = tim.skorBabak.length > 0 ? tim.skorBabak[0].poin : 0;

                return {
                    timId: tim.id,
                    namaSekolah: tim.nama,
                    foto: tim.fotoTim,
                    totalPoin: poinSaatIni,
                    isEliminated: tim.isEliminated,
                    isMe: tim.id === timId
                };
            });

            timDenganSkor.sort((a, b) => b.totalPoin - a.totalPoin);

            const rankedData = timDenganSkor.map((item, index) => ({
                rank: index + 1,
                ...item
            }));

            return res.status(200).json({
                success: true,
                tahap: timSaya.tahapAktif,
                data: rankedData
            });

        } catch (error) {
            console.error("Error Get Leaderboard Tahap:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};