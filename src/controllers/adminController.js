import bcrypt from 'bcrypt';
import { mulaiSiklusPaket, mulaiFaseStrategi, togglePause, forceStopTimer, getGameState, lanjutSoalBerikutnya } from '../sockets/gameHandler.js';
import prisma from '../utils/prisma.js';

export const adminController = {

    createTim: async (req, res) => {
        try {
            const { nama, grup } = req.body;
            if (!nama) return res.status(400).json({ success: false, message: "Nama tim wajib diisi!" });

            const username = nama.toLowerCase().replace(/[^a-z0-9]/g, '');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("123", salt);
            const fotoTim = req.file ? req.file.filename : null;

            const newTim = await prisma.tim.create({
                data: { nama, username, password: hashedPassword, fotoTim, grup: grup ? parseInt(grup) : 1, role: 'peserta' }
            });

            return res.status(201).json({
                success: true,
                message: "Tim berhasil didaftarkan!",
                data: { id: newTim.id, nama: newTim.nama, username: newTim.username, grup: newTim.grup, fotoTim: newTim.fotoTim }
            });
        } catch (error) {
            if (error.code === 'P2002') return res.status(400).json({ success: false, message: "Terjadi bentrok username." });
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
                select: { id: true, pertanyaan: true, tipe: true }
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
                select: { id: true, pertanyaan: true, foto: true, kategori: true, tipe: true, opsiJawaban: true, jawabanBenar: true }
            });
            if (!soal) return res.status(404).json({ success: false, message: "Soal tidak ditemukan" });
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
                data: { pertanyaan, kategori, tipe, opsiJawaban, jawabanBenar, ...(poin && { poin: parseInt(poin) }) }
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
            if (!paket) return res.status(404).json({ message: "Paket tidak ditemukan." });

            const namaPaket = paket.nama.toLowerCase();

            const isSemiFinalStrategi = paket.babak === 'semi_final' && !namaPaket.includes('rebutan');
            const isFinalStrategi = paket.babak === 'final' && (namaPaket.includes('game 2') || namaPaket.includes('score battle'));

            if (isSemiFinalStrategi || isFinalStrategi) {
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

    inisialisasiSemiFinal: async (req, res) => {
        try {
            const timLolos = await prisma.tim.findMany({
                where: { tahapAktif: 'penyisihan', isEliminated: false, role: 'peserta' }
            });

            if (timLolos.length === 0) {
                return res.status(404).json({ success: false, message: "Tidak ada tim dari penyisihan yang bisa dipromosikan." });
            }
            await prisma.$transaction(async (tx) => {
                for (const tim of timLolos) {
                    await tx.tim.update({ where: { id: tim.id }, data: { tahapAktif: 'semi_final' } });
                    await tx.skorBabak.upsert({
                        where: { timId_babak: { timId: tim.id, babak: 'semi_final' } },
                        update: { poin: 1000 },
                        create: { timId: tim.id, babak: 'semi_final', poin: 1000 }
                    });
                }
            });

            return res.status(200).json({
                success: true,
                message: `Mantap! ${timLolos.length} tim berhasil naik kelas ke Semi Final.`,
                data: timLolos.map(t => ({ id: t.id, nama: t.nama }))
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },


    inisialisasiFinal: async (req, res) => {
        try {
            const timLolos = await prisma.tim.findMany({
                where: { tahapAktif: 'semi_final', isEliminated: false, role: 'peserta' },
                include: { skorBabak: { where: { babak: 'semi_final' } } }
            });

            const klasemen = timLolos.map(tim => {
                const skor = tim.skorBabak.length > 0 ? tim.skorBabak[0].poin : 0;
                return { ...tim, totalPoin: skor };
            }).sort((a, b) => b.totalPoin - a.totalPoin);

            const top6 = klasemen.slice(0, 6);

            if (top6.length === 0) {
                return res.status(404).json({ success: false, message: "Tidak ada tim yang bisa dipromosikan ke Final." });
            }

            await prisma.$transaction(async (tx) => {
                for (const tim of top6) {
                    await tx.tim.update({ where: { id: tim.id }, data: { tahapAktif: 'final' } });

                    await tx.skorBabak.upsert({
                        where: { timId_babak: { timId: tim.id, babak: 'final' } },
                        update: { poin: 1000 },
                        create: { timId: tim.id, babak: 'final', poin: 1000 }
                    });
                }
            });

            return res.status(200).json({
                success: true,
                message: `Luar Biasa! ${top6.length} tim melaju ke Grand Final dengan modal 1000 poin.`,
                data: top6.map(t => ({ id: t.id, nama: t.nama }))
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    inputNilaiJuri: async (req, res) => {
        try {
            const { timId, nilai } = req.body; 

            if (!timId || nilai === undefined) return res.status(400).json({ success: false, message: "Data tidak lengkap!" });
            if (nilai < 1 || nilai > 100) return res.status(400).json({ success: false, message: "Nilai juri harus 1 - 100." });

            const tim = await prisma.tim.findUnique({ where: { id: parseInt(timId) } });
            if (!tim || tim.tahapAktif !== 'final') return res.status(400).json({ success: false, message: "Tim tidak valid atau bukan finalis." });

            await prisma.skorBabak.update({
                where: { timId_babak: { timId: tim.id, babak: 'final' } },
                data: { poin: { increment: parseInt(nilai) } }
            });

            // Update Layar LED secara Realtime
            const io = req.app.get('io');
            if (io) {
                io.emit('update_layar_led', {
                    timId: tim.id,
                    namaSekolah: tim.nama,
                    status: 'NILAI JURI',
                    poinTambahan: parseInt(nilai),
                    waktuDetik: 0
                });
            }

            return res.status(200).json({ success: true, message: `Berhasil menambahkan ${nilai} poin ke tim ${tim.nama}.` });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    inputNilaiTambahanSemiFinal: async (req, res) => {
        try {
            const { timId, nilai } = req.body;
            if (!timId || nilai === undefined) return res.status(400).json({ success: false, message: "Data tidak lengkap!" });
            const nilaiInt = parseInt(nilai);
            if (isNaN(nilaiInt)) return res.status(400).json({ success: false, message: "Nilai harus berupa angka." });

            const tim = await prisma.tim.findUnique({ where: { id: parseInt(timId) } });
            if (!tim || tim.tahapAktif !== 'semi_final') return res.status(400).json({ success: false, message: "Tim tidak valid atau bukan di babak Semi Final." });

            await prisma.skorBabak.update({
                where: { timId_babak: { timId: tim.id, babak: 'semi_final' } },
                data: { poin: { increment: nilaiInt } }
            });

            const io = req.app.get('io');
            if (io) {
                io.emit('update_layar_led', {
                    timId: tim.id, namaSekolah: tim.nama,
                    status: 'NILAI TAMBAHAN', poinTambahan: nilaiInt, waktuDetik: 0
                });
            }

            return res.status(200).json({ success: true, message: `Berhasil menambahkan ${nilaiInt} poin ke tim ${tim.nama}.` });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    togglePauseGame: async (req, res) => {
        try {
            const io = req.app.get('io');
            if (!io) return res.status(500).json({ message: "Socket belum siap." });
            const status = togglePause(io);
            return res.status(200).json({
                success: true,
                message: status.isPaused ? "Game berhasil di-PAUSE!" : "Game kembali DILANJUTKAN!",
                data: status
            });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },

    resetPaketTesting: async (req, res) => {
        try {
            const { paketId } = req.params;
            forceStopTimer();

            const paket = await prisma.paketSoal.findUnique({ where: { id: parseInt(paketId) } });
            if (!paket) return res.status(404).json({ success: false, message: "Paket tidak ditemukan!" });

            await prisma.soal.updateMany({ where: { paketSoalId: parseInt(paketId) }, data: { status: 'belum', waktuMulai: null } });
            await prisma.riwayatJawaban.deleteMany({ where: { soal: { paketSoalId: parseInt(paketId) } } });
            await prisma.skorBabak.deleteMany({ where: { babak: paket.babak } });

            if (paket.babak === 'penyisihan') {
                await prisma.tim.updateMany({
                    where: { tahapAktif: 'penyisihan', isEliminated: true },
                    data: { isEliminated: false }
                });
            }

            const io = req.app.get('io');
            if (io) io.emit('game_reset', { message: "Game telah di-reset oleh Admin." });

            return res.status(200).json({ success: true, message: `Paket Soal ID ${paketId} berhasil di-reset!` });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    getDashboardLive: async (req, res) => {
        try {
            const soalAktif = await prisma.soal.findFirst({ where: { status: 'aktif' }, include: { paketSoal: true } });
            let sisaWaktu = 0, targetBabak = 'penyisihan', targetGrup = null;
            const gameState = getGameState();
            const DURASI = parseInt(process.env.DURASI_SOAL) || 180;

            let dataSoalAdmin = null;

            if (soalAktif) {
                targetBabak = soalAktif.paketSoal.babak;
                if (gameState.soalAktifId === soalAktif.id) {
                    sisaWaktu = gameState.sisaWaktu;
                } else if (soalAktif.waktuMulai) {
                    const selisihDetik = Math.floor((new Date().getTime() - soalAktif.waktuMulai.getTime()) / 1000);
                    sisaWaktu = Math.max(0, DURASI - selisihDetik);
                }
                if (targetBabak === 'penyisihan') {
                    const namaPaket = soalAktif.paketSoal.nama.toLowerCase();
                    if (namaPaket.includes('a')) targetGrup = 1;
                    else if (namaPaket.includes('b')) targetGrup = 2;
                    else if (namaPaket.includes('c')) targetGrup = 3;
                    else if (namaPaket.includes('d')) targetGrup = 4;
                }

                // 👇 LOGIKA SENSOR (MASKING) UNTUK DASHBOARD ADMIN
                dataSoalAdmin = {
                    id: soalAktif.id,
                    tipe: soalAktif.tipe,
                    pertanyaan: soalAktif.pertanyaan,
                    foto: soalAktif.foto,                // Ditambahkan agar Admin bisa lihat gambar
                    opsiJawaban: soalAktif.opsiJawaban,  // Ditambahkan agar Admin bisa lihat opsi
                    kategori: soalAktif.kategori,
                    paketNama: soalAktif.paketSoal.nama,
                    jawabanBenar: soalAktif.jawabanBenar
                };

                if (soalAktif.tipe === 'memori') {
                    if (gameState.faseAktif === 'memori_gambar') {
                        dataSoalAdmin.pertanyaan = "Amati gambar berikut dengan saksama!";
                        dataSoalAdmin.opsiJawaban = null;
                    } else if (gameState.faseAktif === 'memori_jeda') {
                        dataSoalAdmin.foto = null;
                        dataSoalAdmin.pertanyaan = "Waktu habis! Bersiaplah, pertanyaan akan segera muncul...";
                        dataSoalAdmin.opsiJawaban = null;
                    } else if (gameState.faseAktif === 'soal') {
                        dataSoalAdmin.foto = null;
                    }
                }
            }

            const aturanPencarian = { role: 'peserta', isEliminated: false, tahapAktif: targetBabak };
            if (targetGrup !== null) aturanPencarian.grup = targetGrup;

            const daftarTim = await prisma.tim.findMany({ where: aturanPencarian, include: { skorBabak: true } });

            const leaderboard = daftarTim.map(tim => {
                const skor = tim.skorBabak.find(s => s.babak === tim.tahapAktif);
                return { id: tim.id, nama: tim.nama, poin: skor ? skor.poin : 0 };
            }).sort((a, b) => b.poin - a.poin);

            return res.status(200).json({
                success: true,
                data: {
                    soalAktif: dataSoalAdmin,
                    sisaWaktuDetik: sisaWaktu,
                    faseAktif: gameState.faseAktif || 'idle',
                    isPaused: gameState.isPaused,
                    timPencetBelId: gameState.timPencetBelId,
                    leaderboard: leaderboard
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    getScoreboardSemiFinal: async (req, res) => {
        try {
            const { paketId } = req.params;
            const teams = await prisma.tim.findMany({
                where: { tahapAktif: 'semi_final', isEliminated: false, role: 'peserta' },
                include: { skorBabak: { where: { babak: 'semi_final' } } }
            });

            let soalFilter = {};
            if (paketId && paketId !== 'all') {
                soalFilter = { paketSoalId: parseInt(paketId) };
            } else {
                const semiFinalPakets = await prisma.paketSoal.findMany({ where: { babak: 'semi_final' } });
                soalFilter = { paketSoalId: { in: semiFinalPakets.map(p => p.id) } };
            }

            const soalList = await prisma.soal.findMany({ where: soalFilter, orderBy: { id: 'asc' }, select: { id: true } });
            const soalIds = soalList.map(s => s.id);

            const scoreboardData = await Promise.all(teams.map(async (tim) => {
                const skor = tim.skorBabak[0]?.poin || 0;
                const taruhan = await prisma.taruhanSoal.findMany({ where: { timId: tim.id, soalId: { in: soalIds } } });
                const riwayat = await prisma.riwayatJawaban.findMany({ where: { timId: tim.id, soalId: { in: soalIds } } });

                const daftarSoal = soalList.map((soal, index) => {
                    const dataTaruhan = taruhan.find(x => x.soalId === soal.id);
                    const dataRiwayat = riwayat.find(x => x.soalId === soal.id);
                    let status = 'BELUM';
                    if (dataRiwayat) status = dataRiwayat.isBenar ? 'BENAR' : 'SALAH';

                    return { nomorSoal: index + 1, soalId: soal.id, poinTaruhan: dataTaruhan ? dataTaruhan.poin : 0, status: status };
                });
                return { id: tim.id, nama: tim.nama, totalPoin: skor, daftarSoal: daftarSoal };
            }));

            scoreboardData.sort((a, b) => b.totalPoin - a.totalPoin);
            return res.status(200).json({ success: true, data: scoreboardData });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    nextSoal: async (req, res) => {
        try {
            const io = req.app.get('io');
            if (!io) return res.status(500).json({ success: false, message: "Socket belum siap." });

            await lanjutSoalBerikutnya(io);
            return res.status(200).json({ success: true, message: "Memuat soal berikutnya..." });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },

    tutupSoalAktif: async (req, res) => {
        try {
            const io = req.app.get('io');
            if (!io) return res.status(500).json({ success: false, message: "Socket belum siap." });

            const state = getGameState();
            if (!state.soalAktifId || !state.paketAktifId) {
                return res.status(400).json({ success: false, message: "Tidak ada soal yang sedang aktif." });
            }

            const { selesaikanSoalSekarang } = await import('../sockets/gameHandler.js');
            await selesaikanSoalSekarang(io, state.paketAktifId);
            return res.status(200).json({ success: true, message: "Soal berhasil ditutup." });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};