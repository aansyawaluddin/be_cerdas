import prisma from '../utils/prisma.js';

let timerInterval = null;
let sisaWaktu = 0;
let soalAktifId = null;

// FASE STRATEGI (KHUSUS SEMI FINAL)
export const mulaiFaseStrategi = async (io, paketId) => {
    try {
        console.log(`[GAME] Memulai Fase Strategi untuk Paket ${paketId}`);
        sisaWaktu = 180;

        io.emit('fase_strategi_mulai', { paketId, sisaWaktu });

        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(async () => {
            sisaWaktu--;
            io.emit('timer_strategi_update', { sisaWaktu });

            if (sisaWaktu <= 0) {
                clearInterval(timerInterval);
                console.log(`[GAME] Waktu Strategi Habis. Bersiap masuk ke Soal 1...`);
                io.emit('fase_strategi_selesai', { message: 'Waktu habis! Mempersiapkan soal...' });

                setTimeout(() => {
                    mulaiSiklusPaket(io, paketId);
                }, 5000);
            }
        }, 1000);

        return true;
    } catch (error) {
        console.error("[ERROR STRATEGI]:", error);
        return false;
    }
};

// SIKLUS SOAL OTOMATIS (PENYISIHAN & SEMI FINAL)
export const mulaiSiklusPaket = async (io, paketId) => {
    try {
        await prisma.soal.updateMany({
            where: { status: 'aktif' },
            data: { status: 'selesai' }
        });

        const soalBerikutnya = await prisma.soal.findFirst({
            where: { paketSoalId: parseInt(paketId), status: 'belum' },
            orderBy: { id: 'asc' }
        });

        if (!soalBerikutnya) {
            io.emit('paket_selesai', { message: "Semua soal di babak ini telah selesai!" });
            console.log(`[GAME] Paket ${paketId} Selesai.`);
            return null;
        }

        const soalAktif = await prisma.soal.update({
            where: { id: soalBerikutnya.id },
            data: { status: 'aktif', waktuMulai: new Date() }
        });

        soalAktifId = soalAktif.id;
        sisaWaktu = 180;

        io.emit('game_mulai', { soalId: soalAktifId, sisaWaktu });
        console.log(`[GAME] Menjalankan Soal ID: ${soalAktifId}`);

        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(async () => {
            sisaWaktu--;
            io.emit('timer_update', { sisaWaktu });

            if (sisaWaktu <= 0) {
                clearInterval(timerInterval);

                await prisma.soal.update({
                    where: { id: soalAktifId },
                    data: { status: 'selesai' }
                });

                io.emit('waktu_habis', { soalId: soalAktifId });
                console.log(`[GAME] Waktu Habis untuk Soal ID: ${soalAktifId}`);

                await prosesEliminasiOtomatis(io, soalAktifId);

                console.log("[GAME] Jeda 5 detik sebelum pindah soal otomatis...");
                setTimeout(() => {
                    mulaiSiklusPaket(io, paketId);
                }, 5000);
            }
        }, 1000);

        return soalAktif;

    } catch (error) {
        console.error("[ERROR SIKLUS]:", error);
        return null;
    }
};

// HANDLER KONEKSI DASAR SOCKET.IO
export const gameSocketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log(`⚡ Klien terhubung: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`🔌 Klien terputus: ${socket.id}`);
        });
    });
};

// OGIKA ELIMINASI 
async function prosesEliminasiOtomatis(io, soalId) {
    try {
        const soal = await prisma.soal.findUnique({
            where: { id: soalId },
            include: { paketSoal: true }
        });

        if (!soal) return;

        const paketSoalId = soal.paketSoalId;
        const babakSekarang = soal.paketSoal.babak;

        if (babakSekarang === 'semi_final') {
            console.log(`[GAME] Soal Semi Final selesai. Menunggu aturan eliminasi...`);
            // TODO: Logika eliminasi Semi Final akan dimasukkan ke sini nanti
            return;
        }

        // LOGIKA ELIMINASI PENYISIHAN
        if (babakSekarang === 'penyisihan') {
            const jumlahSelesai = await prisma.soal.count({
                where: { paketSoalId: paketSoalId, status: 'selesai' }
            });

            const titikEliminasi = [10, 15, 20, 25, 28, 31, 34, 37, 40];

            if (!titikEliminasi.includes(jumlahSelesai)) return;

            const sampelRiwayat = await prisma.riwayatJawaban.findFirst({
                where: { soal: { paketSoalId: paketSoalId } },
                include: { tim: true }
            });

            if (!sampelRiwayat) return;

            const grupAktif = sampelRiwayat.tim.grup;

            const daftarTim = await prisma.tim.findMany({
                where: { grup: grupAktif, tahapAktif: 'penyisihan', isEliminated: false },
                include: {
                    riwayat: {
                        where: { soal: { paketSoalId: paketSoalId } },
                        include: { soal: true }
                    }
                }
            });

            const klasemen = daftarTim.map(tim => {
                let totalPoin = 0;
                let totalWaktu = 0;

                tim.riwayat.forEach(r => {
                    totalPoin += r.poinDidapat;
                    if (r.isBenar && r.soal.waktuMulai) {
                        const durasi = new Date(r.waktuMenjawab).getTime() - new Date(r.soal.waktuMulai).getTime();
                        totalWaktu += durasi;
                    }
                });

                return { id: tim.id, nama: tim.nama, totalPoin, totalWaktu };
            });

            klasemen.sort((a, b) => {
                if (a.totalPoin !== b.totalPoin) return a.totalPoin - b.totalPoin;
                return b.totalWaktu - a.totalWaktu;
            });

            const timTerbawah = klasemen[0];

            if (!timTerbawah) return;

            await prisma.tim.update({
                where: { id: timTerbawah.id },
                data: { isEliminated: true }
            });

            console.log(`[ELIMINASI] ${timTerbawah.nama} tereliminasi (Poin: ${timTerbawah.totalPoin}).`);

            io.emit('animasi_eliminasi', {
                timId: timTerbawah.id,
                nama: timTerbawah.nama,
                pesan: `Gugur di soal ke-${jumlahSelesai}`
            });
        }

    } catch (error) {
        console.error("[ERROR ELIMINASI]:", error);
    }
}