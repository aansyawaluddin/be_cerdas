import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Membersihkan data Paket Soal dan Soal lama...');

    await prisma.soal.deleteMany({});
    await prisma.paketSoal.deleteMany({});

    console.log('✨ Database bersih! Memulai seeding Bank Soal baru...');

    const namaPakets = ['Paket A', 'Paket B', 'Paket C', 'Paket D'];
    const daftarKategori = ['b_indo', 'b_inggris', 'mtk', 'ipa'];

    for (let p = 0; p < namaPakets.length; p++) {
        const namaPaket = namaPakets[p];

        const paket = await prisma.paketSoal.create({
            data: {
                nama: namaPaket,
                babak: 'penyisihan'
            }
        });

        console.log(`✅ [${paket.nama}] berhasil disiapkan.`);

        const dataSoal = [];

        for (let i = 1; i <= 40; i++) {
            const indexKategori = Math.floor((i - 1) / 10);
            const kategoriSoal = daftarKategori[indexKategori];

            dataSoal.push({
                pertanyaan: `[${kategoriSoal.toUpperCase()}] Ini adalah contoh soal nomor ${i} untuk ${namaPaket}. Siapakah penemu konsep ini?`,
                kategori: kategoriSoal,
                tipe: 'pilihan_ganda',
                opsiJawaban: ['Opsi A (Benar)', 'Opsi B (Salah)', 'Opsi C (Salah)', 'Opsi D (Salah)'],
                jawabanBenar: 'Opsi A (Benar)',
                poin: 25,
                status: 'belum',
                waktuMulai: null,
                paketSoalId: paket.id
            });
        }

        await prisma.soal.createMany({
            data: dataSoal
        });
    }

    console.log('🎉 Seeding Soal Selesai!');
    console.log('📊 Total: 4 Paket Soal, 160 Pertanyaan.');
}

main()
    .catch((e) => {
        console.error('❌ Terjadi kesalahan saat seeding Soal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });