import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Membersihkan data Final lama (HANYA BABAK FINAL)...');

    const paketFinalLama = await prisma.paketSoal.findMany({ where: { babak: 'final' } });
    const idPaketFinal = paketFinalLama.map(p => p.id);

    if (idPaketFinal.length > 0) {
        await prisma.soal.deleteMany({ where: { paketSoalId: { in: idPaketFinal } } });
        await prisma.paketSoal.deleteMany({ where: { id: { in: idPaketFinal } } });
    }

    console.log('✨ Data Final bersih! Memulai proses seeding 4 Game Final...');

    const paketRnB = await prisma.paketSoal.create({ data: { nama: "Final - Game 1 (RnB)", babak: 'final' } });
    const soalRnB = [
        { q: "Sebuah mobil bergerak dengan kecepatan 20 m/s selama 10 detik. Jarak yang ditempuh adalah…", cat: "ipa", tipe: "pilihan_ganda", opsi: ["100 m", "150 m", "200 m", "250 m"], ans: "200 m" },
        { q: "Hasil dari (2³ × 3²) adalah…", cat: "mtk", tipe: "pilihan_ganda", opsi: ["36", "72", "48", "64"], ans: "72" },
        { q: "Kata yang mengalami perubahan makna adalah…", cat: "b_indo", tipe: "pilihan_ganda", opsi: ["Buku", "Meja", "Kepala sekolah", "Pensil"], ans: "Kepala sekolah" },
        { q: "Negara berikut yang berbentuk kepulauan adalah…", cat: "ipa", tipe: "pilihan_ganda", opsi: ["Thailand", "Laos", "Indonesia", "Vietnam"], ans: "Indonesia" },
        { q: "Jika semua A adalah B dan tidak ada B yang C, maka…", cat: "mtk", tipe: "pilihan_ganda", opsi: ["Semua A adalah C", "Sebagian A adalah C", "Tidak ada A yang C", "Semua C adalah A"], ans: "Tidak ada A yang C" },
        { q: "Choose the correct sentence:", cat: "b_inggris", tipe: "pilihan_ganda", opsi: ["She have a car", "She has a car", "She having a car", "She haves a car"], ans: "She has a car" },
        { q: "Sebuah benda memiliki massa 3 kg dan percepatan 4 m/s². Gaya yang bekerja adalah…", cat: "ipa", tipe: "pilihan_ganda", opsi: ["7 N", "10 N", "12 N", "15 N"], ans: "12 N" },
        { q: "Unsur kimia dengan simbol O adalah…", cat: "ipa", tipe: "pilihan_ganda", opsi: ["Emas", "Nitrogen", "Oksigen", "Karbon"], ans: "Oksigen" },
        { q: "Gunung tertinggi di dunia adalah…", cat: "ipa", tipe: "pilihan_ganda", opsi: ["Kilimanjaro", "Everest", "Fuji", "Semeru"], ans: "Everest" },
        { q: "Sinonim dari kata “teliti” adalah…", cat: "b_indo", tipe: "pilihan_ganda", opsi: ["Ceroboh", "Cermat", "Cepat", "Lambat"], ans: "Cermat" },
        { q: "Jika 4x + 2 = 18, maka x = …", cat: "mtk", tipe: "esai", opsi: null, ans: "4" },
        { q: "Energi potensial dipengaruhi oleh…", cat: "ipa", tipe: "pilihan_ganda", opsi: ["Kecepatan", "Waktu", "Massa dan ketinggian", "Tekanan"], ans: "Massa dan ketinggian" },
        { q: "“They ___ to school every day.”", cat: "b_inggris", tipe: "pilihan_ganda", opsi: ["goes", "go", "going", "gone"], ans: "go" },
        { q: "Peristiwa yang termasuk perubahan fisika adalah…", cat: "ipa", tipe: "pilihan_ganda", opsi: ["Kayu terbakar", "Besi berkarat", "Es mencair", "Kertas terbakar"], ans: "Es mencair" },
        { q: "Pola bilangan: 3, 9, 27, …", cat: "mtk", tipe: "pilihan_ganda", opsi: ["54", "72", "81", "90"], ans: "81" },
        { q: "Jika hari ini Rabu, maka 5 hari lagi adalah…", cat: "mtk", tipe: "pilihan_ganda", opsi: ["Minggu", "Senin", "Selasa", "Jumat"], ans: "Senin" },
        { q: "Sebuah benda memiliki massa jenis tinggi, maka kemungkinan benda tersebut…", cat: "ipa", tipe: "pilihan_ganda", opsi: ["Ringan", "Mengapung", "Tenggelam", "Menguap"], ans: "Tenggelam" }
    ];
    await prisma.soal.createMany({
        data: soalRnB.map((s, i) => ({
            paketSoalId: paketRnB.id, pertanyaan: `[RnB ${i + 1}] ${s.q}`, kategori: s.cat, tipe: s.tipe, opsiJawaban: s.opsi, jawabanBenar: s.ans, poin: 25, status: "belum"
        }))
    });
    console.log(`✅ [Game 1] Berhasil memasukkan 17 soal ke ${paketRnB.nama}`);


    const paketScore = await prisma.paketSoal.create({ data: { nama: "Final - Game 2 (Score Battle)", babak: 'final' } });
    const soalScore = [
        { q: "Energi kinetik benda bermassa 2 kg dengan kecepatan 4 m/s adalah…", cat: "ipa", opsi: ["8 J", "12 J", "16 J", "20 J"], ans: "16 J" },
        { q: "Sinonim kata “cermat” adalah…", cat: "b_indo", opsi: ["Ceroboh", "Teliti", "Cepat", "Kuat"], ans: "Teliti" },
        { q: "Negara yang pertama kali merdeka di Asia Tenggara adalah…", cat: "ipa", opsi: ["Indonesia", "Malaysia", "Filipina", "Thailand"], ans: "Indonesia" },
        { q: "4, 8, 16, 32, …", cat: "mtk", opsi: ["48", "56", "64", "72"], ans: "64" },
        { q: "“They ___ watching TV now.”", cat: "b_inggris", opsi: ["is", "are", "am", "be"], ans: "are" },
        { q: "Massa jenis benda jika massa 300 g dan volume 150 cm³ adalah…", cat: "ipa", opsi: ["1 g/cm³", "2 g/cm³", "3 g/cm³", "4 g/cm³"], ans: "2 g/cm³" },
        { q: "Organ yang memompa darah adalah…", cat: "ipa", opsi: ["Paru-paru", "Jantung", "Hati", "Ginjal"], ans: "Jantung" },
        { q: "Kegiatan ekonomi menghasilkan barang disebut…", cat: "b_indo", opsi: ["Konsumsi", "Produksi", "Distribusi", "Investasi"], ans: "Produksi" },
        { q: "Jika semua A adalah B dan tidak ada B yang C, maka…", cat: "mtk", opsi: ["Semua A adalah C", "Sebagian A adalah C", "Tidak ada A yang C", "Semua C adalah A"], ans: "Tidak ada A yang C" },
        { q: "Hasil dari 5² + 3² adalah…", cat: "mtk", opsi: ["28", "30", "34", "36"], ans: "34" },
        { q: "Garis yang membagi bumi menjadi utara dan selatan adalah…", cat: "ipa", opsi: ["Bujur", "Khatulistiwa", "Meridian", "Horizon"], ans: "Khatulistiwa" },
        { q: "Kata baku yang benar adalah…", cat: "b_indo", opsi: ["Resiko", "Risiko", "Resikku", "Resik"], ans: "Risiko" },
        { q: "Bunyi tidak dapat merambat di…", cat: "ipa", opsi: ["Air", "Udara", "Logam", "Ruang hampa"], ans: "Ruang hampa" },
        { q: "“He ___ a book every day.”", cat: "b_inggris", opsi: ["read", "reads", "reading", "reades"], ans: "reads" },
        { q: "Proses perubahan zat menjadi zat baru disebut…", cat: "ipa", opsi: ["Perubahan fisika", "Perubahan kimia", "Reaksi fisika", "Perubahan bentuk"], ans: "Perubahan kimia" },
        { q: "2, 6, 12, 20, …", cat: "mtk", opsi: ["24", "28", "30", "32"], ans: "30" },
        { q: "Jika 2x + 6 = 14, maka x = …", cat: "mtk", opsi: ["2", "3", "4", "5"], ans: "4" },
        { q: "A: “Semakin banyak tidur, baik untuk kesehatan.” Hasil penelitian: “tidur terlalu lama meningkatkan risiko obesitas” Manakah pernyataan berikut yang PALING TEPAT?", cat: "b_indo", opsi: ["Memperkuat pernyataan A", "Memperlemah pernyataan A", "Memperlemah pernyataan B", "Memperkuat pernyataan B"], ans: "Memperlemah pernyataan A" },
        { q: "Ingat urutan: 9 – 2 – 7 – 4 – 6. Angka ke-3 adalah…", cat: "mtk", opsi: ["2", "7", "4", "6"], ans: "7" },
        { q: "Energi potensial benda bermassa 2 kg pada ketinggian 5 m (g = 10 m/s²) adalah…", cat: "ipa", opsi: ["50 J", "100 J", "150 J", "200 J"], ans: "100 J" }
    ];
    await prisma.soal.createMany({
        data: soalScore.map((s, i) => ({
            paketSoalId: paketScore.id, pertanyaan: `[SCORE BATTLE ${i + 1}] ${s.q}`, kategori: s.cat, tipe: "pilihan_ganda", opsiJawaban: s.opsi, jawabanBenar: s.ans, poin: 10, status: "belum"
        }))
    });
    console.log(`✅ [Game 2] Berhasil memasukkan 20 soal ke ${paketScore.nama}`);


    const paketCollab = await prisma.paketSoal.create({ data: { nama: "Final - Game 3 (Collaborative)", babak: 'final' } });
    const soalCollab = [
        // R1
        { q: "Sebuah benda bergerak dengan kecepatan 12 m/s selama 5 detik. Jaraknya adalah…", tipe: "esai", opsi: null, ans: "60 m" },
        { q: "Hasil dari 9 × (4 + 2) adalah…", tipe: "pilihan_ganda", opsi: ["36", "45", "54", "60"], ans: "54" },
        { q: "Bagian sel yang mengatur seluruh aktivitas sel adalah…", tipe: "pilihan_ganda", opsi: ["Membran", "Sitoplasma", "Inti sel", "Dinding sel"], ans: "Inti sel" },
        { q: "Kata yang memiliki makna denotatif adalah…", tipe: "pilihan_ganda", opsi: ["Buah hati", "Buku pelajaran", "Kambing hitam", "Meja hijau"], ans: "Buku pelajaran" },
        { q: "“We ___ going to the market.”", tipe: "pilihan_ganda", opsi: ["is", "are", "am", "be"], ans: "are" },
        { q: "Negara yang dikenal sebagai “Negeri Matahari Terbit” adalah…", tipe: "pilihan_ganda", opsi: ["Korea", "Jepang", "China", "Thailand"], ans: "Jepang" },
        { q: "Kegiatan menghasilkan jasa disebut…", tipe: "pilihan_ganda", opsi: ["Konsumsi", "Produksi", "Distribusi", "Transaksi"], ans: "Produksi" },
        { q: "Jika 4x − 8 = 16, maka x = …", tipe: "pilihan_ganda", opsi: ["4", "5", "6", "7"], ans: "6" },
        { q: "Ingat urutan: 6 – 1 – 9 – 3. Angka ke-3 adalah…", tipe: "pilihan_ganda", opsi: ["1", "6", "9", "3"], ans: "9" },
        { q: "Energi listrik diubah menjadi energi gerak pada…", tipe: "pilihan_ganda", opsi: ["Lampu", "Setrika", "Kipas angin", "Kompor"], ans: "Kipas angin" },
        // R2
        { q: "Hasil dari 15² − 10² adalah…", tipe: "pilihan_ganda", opsi: ["100", "125", "150", "175"], ans: "125" },
        { q: "Tekanan dirumuskan sebagai…", tipe: "pilihan_ganda", opsi: ["F × s", "F / A", "m × a", "v × t"], ans: "F / A" },
        { q: "Organ pada tumbuhan yang berfungsi menyerap air adalah…", tipe: "pilihan_ganda", opsi: ["Akar", "Batang", "Daun", "Bunga"], ans: "Akar" },
        { q: "Antonim kata “sempit” adalah…", tipe: "pilihan_ganda", opsi: ["Kecil", "Luas", "Tinggi", "Pendek"], ans: "Luas" },
        { q: "“He ___ finished his homework.”", tipe: "pilihan_ganda", opsi: ["have", "has", "had", "having"], ans: "has" },
        { q: "Benua dengan jumlah negara terbanyak adalah…", tipe: "pilihan_ganda", opsi: ["Asia", "Afrika", "Eropa", "Amerika"], ans: "Afrika" },
        { q: "Barang yang digunakan untuk memenuhi kebutuhan disebut…", tipe: "pilihan_ganda", opsi: ["Produksi", "Konsumsi", "Distribusi", "Investasi"], ans: "Konsumsi" },
        { q: "Pola bilangan: 2, 5, 10, 17, …", tipe: "pilihan_ganda", opsi: ["22", "24", "26", "28"], ans: "26" },
        { q: "Ingat: 1 – 4 – 2 – 7 – 5. Angka ke-2 adalah…", tipe: "pilihan_ganda", opsi: ["1", "4", "2", "7"], ans: "4" },
        { q: "Jika gaya 8 N memindahkan benda sejauh 5 m, usaha yang dilakukan adalah…", tipe: "pilihan_ganda", opsi: ["30 J", "35 J", "40 J", "45 J"], ans: "40 J" },
        // R3
        { q: "Hasil dari (16 ÷ 4) × 3 adalah…", tipe: "pilihan_ganda", opsi: ["8", "10", "12", "14"], ans: "12" },
        { q: "Energi kinetik benda bermassa 1 kg dengan kecepatan 8 m/s adalah…", tipe: "pilihan_ganda", opsi: ["16 J", "24 J", "32 J", "40 J"], ans: "32 J" },
        { q: "Jika 2 mol gas menempati volume 44,8 L (STP), maka volume 0,25 mol adalah…", tipe: "pilihan_ganda", opsi: ["2,8 L", "4,2 L", "5,6 L", "11,2 L"], ans: "5,6 L" },
        { q: "Kata “bermain” termasuk jenis kata…", tipe: "pilihan_ganda", opsi: ["Nomina", "Verba", "Adjektiva", "Konjungsi"], ans: "Verba" },
        { q: "“They ___ not ready yet.”", tipe: "pilihan_ganda", opsi: ["is", "are", "am", "be"], ans: "are" },
        { q: "Tokoh yang membacakan teks Proklamasi adalah…", tipe: "pilihan_ganda", opsi: ["Hatta", "Soekarno", "Soeharto", "Habibie"], ans: "Soekarno" },
        { q: "Interaksi antara individu dan kelompok disebut…", tipe: "pilihan_ganda", opsi: ["Konflik", "Interaksi sosial", "Adaptasi", "Integrasi"], ans: "Interaksi sosial" },
        { q: "Jika 6x = 42, maka x = …", tipe: "pilihan_ganda", opsi: ["5", "6", "7", "8"], ans: "7" },
        { q: "Ingat urutan: 2 – 8 – 5 – 1. Angka terakhir adalah…", tipe: "pilihan_ganda", opsi: ["2", "8", "5", "1"], ans: "1" },
        { q: "Perubahan gas menjadi cair disebut…", tipe: "pilihan_ganda", opsi: ["Menguap", "Mengembun", "Membeku", "Menyublim"], ans: "Mengembun" }
    ];
    await prisma.soal.createMany({
        data: soalCollab.map((s, i) => ({
            paketSoalId: paketCollab.id, pertanyaan: `[COLLAB R${Math.floor(i / 10) + 1}-${i % 10 + 1}] ${s.q}`, kategori: "ipa", tipe: s.tipe, opsiJawaban: s.opsi, jawabanBenar: s.ans, poin: 25, status: "belum"
        }))
    });
    console.log(`✅ [Game 3] Berhasil memasukkan 30 soal ke ${paketCollab.nama}`);


    const paketCase = await prisma.paketSoal.create({ data: { nama: "Final - Game 4 (Case Battle)", babak: 'final' } });
    const soalCase = [
        { q: "Penggunaan media sosial dan gadget di kalangan pelajar meningkat pesat...\nPertanyaan:\n1. Bagaimana tim memandang fenomena ini?\n2. Apa dampak positif dan negatifnya?\n3. Solusi agar teknologi tetap produktif?" },
        { q: "Dalam beberapa tahun terakhir, suhu global meningkat dan cuaca ekstrem sering terjadi...\nPertanyaan:\n1. Bagaimana sudut pandang tim?\n2. Dampaknya terhadap lingkungan dan sosial?\n3. Solusi bagi pemerintah dan masyarakat?" },
        { q: "Harga bahan pokok di beberapa daerah naik, berdampak pada daya beli & kesenjangan...\nPertanyaan:\n1. Bagaimana sudut pandang tim?\n2. Apa dampaknya ke masyarakat luas?\n3. Solusi untuk masalah ini?" }
    ];
    await prisma.soal.createMany({
        data: soalCase.map((s, i) => ({
            paketSoalId: paketCase.id, pertanyaan: `[CASE BATTLE ${i + 1}]\n${s.q}`, kategori: "b_indo", tipe: "esai", opsiJawaban: null, jawabanBenar: "Penilaian Juri", poin: 0, status: "belum"
        }))
    });
    console.log(`✅ [Game 4] Berhasil memasukkan 3 soal ke ${paketCase.nama}`);

    console.log("\n🎉 Seeding Data Grand Final Selesai! Database siap untuk Partai Puncak.");
}

main().catch(console.error).finally(() => prisma.$disconnect());