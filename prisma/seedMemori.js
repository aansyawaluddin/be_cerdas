import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧠 Memulai seeding khusus untuk Soal Memori...');

    const paketA = await prisma.paketSoal.findFirst({ where: { nama: 'Paket A', babak: 'penyisihan' } });
    const paketB = await prisma.paketSoal.findFirst({ where: { nama: 'Paket B', babak: 'penyisihan' } });

    if (!paketA || !paketB) {
        console.error('❌ Paket A atau Paket B tidak ditemukan! Jalankan seed soal utama terlebih dahulu.');
        process.exit(1);
    }

    const dataSoalMemori = [
        {
            paketSoalId: paketA.id,
            kategori: 'ipa',
            tipe: 'memori',
            foto: 'https://dummyimage.com/800x450/1e293b/0ea5e9.png&text=++[Jam+Dinding:+09:15]+++[Papan+Tulis:+H2SO4]+++[Tabung:+Merah,+Biru,+Hijau]++',
            pertanyaan: 'Berdasarkan gambar meja laboratorium yang baru saja Anda amati, pada pukul berapakah jam dinding di ruangan tersebut menunjuk?',
            opsiJawaban: ['08:15', '09:15', '09:45', '10:15'],
            jawabanBenar: '09:15',
            poin: 25,
            status: 'belum'
        },
    ];


    let totalDibuat = 0;
    for (const soal of dataSoalMemori) {
        const created = await prisma.soal.create({
            data: soal
        });
        totalDibuat++;
        console.log(`✅ Berhasil menyisipkan Soal Memori ke [Paket ID: ${created.paketSoalId}].`);
    }

    console.log(`🎉 Seeding Soal Memori Selesai! Berhasil menambahkan ${totalDibuat} soal.`);
}

main()
    .catch((e) => {
        console.error('❌ Terjadi kesalahan saat seeding Soal Memori:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });