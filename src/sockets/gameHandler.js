import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

let timerInterval = null;
let sisaWaktu = 0;
let soalAktifId = null;
let paketAktifId = null;
let isPaused = false;
let faseAktif = 'idle';
let timPencetBelId = null;

export const mulaiFaseStrategi = async (io, paketId) => {
    try {
        const DURASI = parseInt(process.env.DURASI_STRATEGI) || 180;
        console.log(`[GAME] Memulai Fase Strategi untuk Paket ${paketId}`);
        faseAktif = 'strategi';
        sisaWaktu = DURASI;
        paketAktifId = paketId;

        io.emit('fase_strategi_mulai', { paketId, sisaWaktu });
        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(async () => {
            if (isPaused) return;
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
        return false;
    }
};

export const mulaiJedaIstirahat = (io, currentPaketId) => {
    const DURASI_JEDA = parseInt(process.env.DURASI_JEDA) || 180;
    console.log(`[GAME] Memasuki Waktu Istirahat ${DURASI_JEDA} Detik...`);
    faseAktif = 'jeda';
    sisaWaktu = DURASI_JEDA;
    isPaused = false;
    soalAktifId = null;

    io.emit('jeda_mulai', { sisaWaktu });
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(async () => {
        if (isPaused) return;
        sisaWaktu--;
        io.emit('timer_jeda_update', { sisaWaktu });

        if (sisaWaktu <= 0) {
            clearInterval(timerInterval);
            console.log(`[GAME] Waktu Istirahat Habis.`);
            try {
                const paketSelanjutnya = await prisma.paketSoal.findFirst({
                    where: { babak: 'semi_final', id: { gt: parseInt(currentPaketId) } },
                    orderBy: { id: 'asc' }
                });

                if (paketSelanjutnya) {
                    console.log(`[GAME] Jeda Selesai. Masuk otomatis ke Fase Strategi Paket: ${paketSelanjutnya.id}`);
                    io.emit('jeda_selesai', { message: "Istirahat selesai! Memasuki Fase Strategi Game selanjutnya." });

                    // CEK JIKA INI GAME REBUTAN (TIDAK PERLU STRATEGI)
                    if (paketSelanjutnya.nama.toLowerCase().includes('rebutan')) {
                        mulaiSiklusPaket(io, paketSelanjutnya.id);
                    } else {
                        mulaiFaseStrategi(io, paketSelanjutnya.id);
                    }
                } else {
                    io.emit('semi_final_selesai', { message: "Seluruh rangkaian Semi Final telah berakhir!" });
                }
            } catch (e) {
                console.error("[ERROR JEDA]", e);
            }
        }
    }, 1000);
};

export const mulaiSiklusPaket = async (io, paketId) => {
    try {
        const DURASI = parseInt(process.env.DURASI_SOAL) || 180;
        paketAktifId = paketId;
        faseAktif = 'soal';
        isPaused = false;

        timPencetBelId = null;

        await prisma.soal.updateMany({
            where: { status: 'aktif' },
            data: { status: 'selesai' }
        });

        const soalBerikutnya = await prisma.soal.findFirst({
            where: { paketSoalId: parseInt(paketId), status: 'belum' },
            orderBy: { id: 'asc' }
        });

        if (!soalBerikutnya) {
            console.log(`[GAME] Paket ${paketId} Selesai.`);
            const infoPaket = await prisma.paketSoal.findUnique({ where: { id: parseInt(paketId) } });

            if (infoPaket && infoPaket.babak === 'semi_final') {
                io.emit('paket_selesai', { message: "Game selesai! Memasuki waktu istirahat." });
                mulaiJedaIstirahat(io, paketId);
            } else {
                io.emit('paket_selesai', { message: "Semua soal di babak ini telah selesai!" });
            }
            return null;
        }

        const soalAktif = await prisma.soal.update({
            where: { id: soalBerikutnya.id },
            data: { status: 'aktif', waktuMulai: new Date() }
        });

        soalAktifId = soalAktif.id;
        sisaWaktu = DURASI;

        io.emit('game_mulai', { soalId: soalAktifId, sisaWaktu });
        console.log(`[GAME] Menjalankan Soal ID: ${soalAktifId}`);

        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(async () => {
            if (isPaused) return;
            sisaWaktu--;
            io.emit('timer_update', { sisaWaktu });

            if (sisaWaktu <= 0) {
                clearInterval(timerInterval);
                await prisma.soal.update({ where: { id: soalAktifId }, data: { status: 'selesai' } });
                io.emit('waktu_habis', { soalId: soalAktifId });
                console.log(`[GAME] Waktu Habis untuk Soal ID: ${soalAktifId}`);

                await prosesEliminasiOtomatis(io, soalAktifId);

                setTimeout(() => { mulaiSiklusPaket(io, paketId); }, 5000);
            }
        }, 1000);

        return soalAktif;
    } catch (error) {
        console.error("[ERROR SIKLUS]:", error);
        return null;
    }
};

export const selesaikanSoalSekarang = async (io, paketId) => {
    if (timerInterval) clearInterval(timerInterval);

    if (soalAktifId) {
        await prisma.soal.update({ where: { id: soalAktifId }, data: { status: 'selesai' } });
        io.emit('waktu_habis', { soalId: soalAktifId });
        console.log(`[GAME] Soal ID ${soalAktifId} ditutup paksa karena sudah dijawab di babak rebutan.`);
    }

    // Pindah otomatis setelah 5 detik
    setTimeout(() => {
        mulaiSiklusPaket(io, paketId);
    }, 5000);
};

export const prosesTekanBel = (io, timId) => {
    if (timPencetBelId) return false; 
    timPencetBelId = timId;
    io.emit('bel_ditekan', { timId: timId }); 
    return true;
};

export const togglePause = (io) => {
    if (!soalAktifId && !paketAktifId) throw new Error("Tidak ada game yang sedang berjalan.");
    isPaused = !isPaused;
    if (isPaused) {
        io.emit('game_paused', { message: "Game dihentikan sementara." });
    } else {
        io.emit('game_resumed', { message: "Game dilanjutkan." });
    }
    return { isPaused, sisaWaktu };
};

export const forceStopTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    isPaused = false;
    sisaWaktu = 0;
    soalAktifId = null;
    paketAktifId = null;
    faseAktif = 'idle';
    timPencetBelId = null;
};

export const getGameState = () => {
    return {
        isPaused,
        sisaWaktu,
        soalAktifId,
        paketAktifId,
        faseAktif,
        timPencetBelId
    };
};

export const gameSocketHandler = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            socket.user = { role: 'led', username: 'Layar Panggung' };
            return next();
        }
        try {
            if (!process.env.JWT_SECRET) return next(new Error("Server Configuration Error"));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error("Token tidak valid"));
        }
    });

    io.on('connection', (socket) => {
        const role = socket.user?.role;
        if (role === 'admin') socket.join('admin');
        else if (role === 'peserta') {
            socket.join('peserta');
            const state = getGameState();
            if (state.faseAktif === 'soal' && state.soalAktifId) {
                socket.emit('game_mulai', { soalId: state.soalAktifId, sisaWaktu: state.sisaWaktu });
            } else if (state.faseAktif === 'strategi' && state.paketAktifId) {
                socket.emit('fase_strategi_mulai', { paketId: state.paketAktifId, sisaWaktu: state.sisaWaktu });
            } else if (state.faseAktif === 'jeda') {
                socket.emit('jeda_mulai', { sisaWaktu: state.sisaWaktu });
            }
        } else {
            socket.join('led');
        }
    });
};

async function prosesEliminasiOtomatis(io, soalId) {
    try {
        const soal = await prisma.soal.findUnique({ where: { id: soalId }, include: { paketSoal: true } });
        if (!soal) return;

        const paketSoalId = soal.paketSoalId;
        const babakSekarang = soal.paketSoal.babak;

        if (babakSekarang === 'semi_final') {
            const soalSisa = await prisma.soal.count({ where: { paketSoalId: paketSoalId, status: 'belum' } });
            const paketBerikutnya = await prisma.paketSoal.findFirst({ where: { babak: 'semi_final', id: { gt: paketSoalId } } });

            if (soalSisa === 0 && !paketBerikutnya) {
                const daftarTimSemiFinal = await prisma.tim.findMany({
                    where: { tahapAktif: 'semi_final', isEliminated: false },
                    include: { skorBabak: true }
                });
                const klasemenAkhir = daftarTimSemiFinal.map(tim => {
                    const skor = tim.skorBabak.find(s => s.babak === 'semi_final');
                    return { id: tim.id, nama: tim.nama, poin: skor ? skor.poin : 0 };
                }).sort((a, b) => a.poin - b.poin);

                const timGugur = klasemenAkhir.slice(0, 6);
                for (const tim of timGugur) {
                    await prisma.tim.update({ where: { id: tim.id }, data: { isEliminated: true } });
                    io.emit('animasi_eliminasi', { timId: tim.id, nama: tim.nama, pesan: `Gugur di Babak Semi Final (Poin Akhir: ${tim.poin})` });
                }
            }
            return;
        }

        if (babakSekarang === 'penyisihan') {
            const jumlahSelesai = await prisma.soal.count({ where: { paketSoalId: paketSoalId, status: 'selesai' } });
            const titikEliminasi = [10, 15, 20, 25, 30, 35];
            if (!titikEliminasi.includes(jumlahSelesai)) return;

            let grupAktif = null;
            const namaPaket = soal.paketSoal.nama.toLowerCase();
            if (namaPaket.includes('a')) grupAktif = 1;
            else if (namaPaket.includes('b')) grupAktif = 2;

            if (grupAktif === null) return;

            const daftarTim = await prisma.tim.findMany({
                where: { grup: grupAktif, tahapAktif: 'penyisihan', isEliminated: false },
                include: { skorBabak: true, riwayat: { where: { soal: { paketSoalId: paketSoalId } }, include: { soal: true } } }
            });

            if (daftarTim.length === 0) return;

            const klasemen = daftarTim.map(tim => {
                const skor = tim.skorBabak.find(s => s.babak === 'penyisihan');
                let totalPoin = skor ? skor.poin : 0;
                let totalWaktu = 0;
                tim.riwayat.forEach(r => {
                    if (r.isBenar && r.soal.waktuMulai) {
                        const waktuPencet = r.waktuMenjawab || r.createdAt;
                        if (waktuPencet) {
                            totalWaktu += new Date(waktuPencet).getTime() - new Date(r.soal.waktuMulai).getTime();
                        }
                    }
                });
                return { id: tim.id, nama: tim.nama, totalPoin, totalWaktu };
            }).sort((a, b) => {
                if (a.totalPoin !== b.totalPoin) return a.totalPoin - b.totalPoin;
                return b.totalWaktu - a.totalWaktu;
            });

            const timTerbawah = klasemen[0];
            if (!timTerbawah) return;

            await prisma.tim.update({ where: { id: timTerbawah.id }, data: { isEliminated: true } });
            io.emit('animasi_eliminasi', { timId: timTerbawah.id, nama: timTerbawah.nama, pesan: `Gugur di soal ke-${jumlahSelesai}` });
        }
    } catch (error) {
        console.error("[ERROR ELIMINASI]:", error);
    }
}