import prisma from '../utils/prisma.js';

let timerInterval = null;
let sisaWaktu = 0;
let soalAktifId = null;

export const mulaiSiklusPaket = async (io, paketId) => {
    try {
        await prisma.soal.updateMany({
            where: { status: 'aktif' },
            data: { status: 'selesai' }
        });

        const soalBerikutnya = await prisma.soal.findFirst({
            where: {
                paketSoalId: parseInt(paketId),
                status: 'belum'
            },
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

        // Bersihkan timer lama jika ada
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


export const gameSocketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log(`⚡ Klien terhubung: ${socket.id}`);

        socket.on('peserta_kirim_jawaban', async (data) => {
            const { timId, jawabanTim } = data;

            const soal = await prisma.soal.findUnique({ where: { id: soalAktifId } });

            if (!soal || soal.status !== 'aktif') {
                return socket.emit('error_game', { message: 'Soal tidak aktif atau waktu habis!' });
            }

            const lamaBerpikir = 180 - sisaWaktu;
            const penguranganPoin = Math.floor(lamaBerpikir / 7);

            let poinDidapat = 0;
            const isBenar = jawabanTim.trim().toLowerCase() === soal.jawabanBenar.trim().toLowerCase();

            if (isBenar) {
                poinDidapat = Math.max(0, soal.poin - penguranganPoin);
            }

            await prisma.riwayatJawaban.create({
                data: {
                    timId,
                    soalId: soalAktifId,
                    jawabanTim,
                    isBenar,
                    poinDidapat
                }
            });

            io.emit('update_layar_led', {
                timId,
                status: isBenar ? 'BENAR' : 'SALAH',
                poinTambahan: poinDidapat,
                waktuMenjawab: lamaBerpikir
            });

            socket.emit('feedback_jawaban', { success: true, poin: poinDidapat });
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Klien terputus: ${socket.id}`);
        });
    });
};


async function prosesEliminasiOtomatis(io, soalId) {
    try {
        const soal = await prisma.soal.findUnique({
            where: { id: soalId },
            include: { paketSoal: true }
        });

        if (!soal) return;

        const paketSoalId = soal.paketSoalId;

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

        io.emit('animasi_eliminasi', {
            timId: timTerbawah.id,
            nama: timTerbawah.nama,
            pesan: `Gugur di soal ke-${jumlahSelesai}`
        });

    } catch (error) {
        console.error("[ERROR ELIMINASI]:", error);
    }
}