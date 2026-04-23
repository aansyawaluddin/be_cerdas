import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Membersihkan data Paket Soal dan Soal lama (HANYA BABAK SEMI FINAL)...');

    // Hapus data Semi Final lama agar tidak duplikat
    const paketSemiFinalLama = await prisma.paketSoal.findMany({ where: { babak: 'semi_final' } });
    const idPaketSemi = paketSemiFinalLama.map(p => p.id);

    if (idPaketSemi.length > 0) {
        await prisma.soal.deleteMany({ where: { paketSoalId: { in: idPaketSemi } } });
        await prisma.paketSoal.deleteMany({ where: { id: { in: idPaketSemi } } });
    }

    console.log('✨ Data Semi Final bersih! Memulai seeding...');

    // ==========================================
    // 1. BUAT PAKET UTAMA (50 SOAL SEKALIGUS)
    // ==========================================
    const paketUtama = await prisma.paketSoal.create({
        data: { nama: "Semi Final", babak: 'semi_final' }
    });
    console.log(`✅ Paket dibuat: [ID: ${paketUtama.id}] ${paketUtama.nama}`);

    const daftar50Soal = [
        // --- GAME 1 ---
        { pertanyaan: "Hasil dari 3² × 4² adalah…", kategori: "mtk", tipe: "esai", opsi: null, jawaban: "144" },
        { pertanyaan: "Sinonim kata “cepat” adalah…", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Lambat", "Kilat", "Berat", "Panjang"], jawaban: "Kilat" },
        { pertanyaan: "Negara anggota ASEAN yang tidak pernah dijajah adalah…", kategori: "b_indo", tipe: "esai", opsi: null, jawaban: "Thailand" },
        { pertanyaan: "Jika semua P adalah Q, dan Q adalah R, maka…", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["Semua P adalah R", "Semua R adalah P", "Sebagian P bukan R", "Tidak dapat disimpulkan"], jawaban: "Semua P adalah R" },
        { pertanyaan: "Choose the correct sentence:", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["She don’t like milk", "She doesn’t like milk", "She not like milk", "She didn’t likes milk"], jawaban: "She doesn’t like milk" },
        { pertanyaan: "Nilai dari √225 adalah…", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["10", "15", "20", "25"], jawaban: "15" },
        { pertanyaan: "Perubahan energi listrik menjadi cahaya terjadi pada…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Setrika", "Kipas", "Lampu", "Kompor"], jawaban: "Lampu" },
        { pertanyaan: "Kata “membaca” termasuk…", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Nomina", "Verba", "Adjektiva", "Konjungsi"], jawaban: "Verba" },
        { pertanyaan: "5, 10, 20, 40, …", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["60", "80", "100", "120"], jawaban: "80" },
        { pertanyaan: "Ingat urutan berikut: 7 – 2 – 9 – 4. Angka kedua adalah…", kategori: "mtk", tipe: "memori", opsi: ["7", "2", "9", "4"], jawaban: "2" },

        // --- GAME 2 ---
        { pertanyaan: "Luas segitiga dengan alas 10 dan tinggi 6 adalah…", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["20", "40", "30", "60"], jawaban: "30" },
        { pertanyaan: "Antonim “kuat” adalah…", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Hebat", "Lemah", "Cepat", "Tinggi"], jawaban: "Lemah" },
        { pertanyaan: "Ibu kota negara Jepang adalah…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Osaka", "Tokyo", "Kyoto", "Nagoya"], jawaban: "Tokyo" },
        { pertanyaan: "Jika 2x + 4 = 10, maka x = …", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["2", "3", "4", "5"], jawaban: "3" },
        { pertanyaan: "“They ___ playing football.” Complete this sentence", kategori: "b_inggris", tipe: "esai", opsi: null, jawaban: "are" },
        { pertanyaan: "Gaya gesek terjadi karena…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Udara", "Air", "Permukaan benda", "Cahaya"], jawaban: "Permukaan benda" },
        { pertanyaan: "Paragraf dengan ide pokok di akhir disebut…", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Deduktif", "Induktif", "Campuran", "Naratif"], jawaban: "Induktif" },
        { pertanyaan: "Negara dengan luas wilayah terbesar di dunia adalah…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["China", "Amerika", "Rusia", "Kanada"], jawaban: "Rusia" },
        { pertanyaan: "12, 24, 36, …", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["40", "48", "50", "60"], jawaban: "48" },
        { pertanyaan: "Ingat: Merah – Biru – Kuning – Hijau. Warna ketiga adalah…", kategori: "b_indo", tipe: "memori", opsi: ["Merah", "Biru", "Kuning", "Hijau"], jawaban: "Kuning" },

        // --- GAME 3 ---
        { pertanyaan: "Sebuah benda bermassa 4 kg dipercepat 5 m/s². Gaya yang bekerja adalah…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["10 N", "15 N", "20 N", "25 N"], jawaban: "20 N" },
        { pertanyaan: "Usaha yang dilakukan gaya 15 N untuk memindahkan benda sejauh 4 m adalah…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["30 J", "45 J", "60 J", "75 J"], jawaban: "60 J" },
        { pertanyaan: "Energi kinetik benda bermassa 2 kg dengan kecepatan 6 m/s adalah…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["12 J", "24 J", "36 J", "48 J"], jawaban: "36 J" },
        { pertanyaan: "Massa jenis benda jika massanya 500 g dan volumenya 100 cm³ adalah…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["2 g/cm³", "3 g/cm³", "5 g/cm³", "6 g/cm³"], jawaban: "5 g/cm³" },
        { pertanyaan: "Energi potensial benda bermassa 2 kg pada ketinggian 10 m (g = 10 m/s²) adalah…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["100 J", "150 J", "200 J", "250 J"], jawaban: "200 J" },
        { pertanyaan: "Energi potensial dipengaruhi oleh…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Massa saja", "Massa dan tinggi", "Suhu", "Tekanan"], jawaban: "Massa dan tinggi" },
        { pertanyaan: "Kalimat tanya diakhiri dengan…", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Titik", "Tanda tanya", "Koma", "Titik dua"], jawaban: "Tanda tanya" },
        { pertanyaan: "Gunung tertinggi di dunia adalah…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Kilimanjaro", "Everest", "Fuji", "Elbrus"], jawaban: "Everest" },
        { pertanyaan: "3, 6, 9, 12, …", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["13", "14", "15", "16"], jawaban: "15" },
        { pertanyaan: "Ingat angka: 5 – 8 – 3 – 6. Angka terakhir adalah…", kategori: "mtk", tipe: "memori", opsi: ["5", "8", "3", "6"], jawaban: "6" },

        // --- GAME 4 ---
        { pertanyaan: "Keliling persegi sisi 5 adalah…", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["10", "15", "20", "25"], jawaban: "20" },
        { pertanyaan: "Sinonim “besar” adalah…", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Kecil", "Luas", "Sempit", "Pendek"], jawaban: "Luas" },
        { pertanyaan: "Mata uang Korea Selatan adalah…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Yen", "Won", "Yuan", "Dollar"], jawaban: "Won" },
        { pertanyaan: "Jika x = 4, maka 2x² = …", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["8", "16", "32", "64"], jawaban: "32" },
        { pertanyaan: "“I ___ eating now.”", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["is", "are", "am", "be"], jawaban: "am" },
        { pertanyaan: "Bunyi merambat melalui…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Cahaya", "Ruang hampa", "Medium", "Magnet"], jawaban: "Medium" },
        { pertanyaan: "Kata “indah” termasuk…", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Verba", "Adjektiva", "Nomina", "Konjungsi"], jawaban: "Adjektiva" },
        { pertanyaan: "Benua terkecil adalah…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Eropa", "Afrika", "Australia", "Antartika"], jawaban: "Australia" },
        { pertanyaan: "4, 9, 16, 25, …", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["30", "34", "36", "40"], jawaban: "36" },
        { pertanyaan: "Ingat: A – D – F – B. Huruf kedua adalah…", kategori: "b_indo", tipe: "memori", opsi: ["A", "D", "F", "B"], jawaban: "D" },

        // --- GAME 5 ---
        { pertanyaan: "Luas persegi sisi 6 adalah…", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["12", "24", "36", "48"], jawaban: "36" },
        { pertanyaan: "Antonim “tinggi” adalah…", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Besar", "Rendah", "Panjang", "Luas"], jawaban: "Rendah" },
        { pertanyaan: "Organisasi dunia adalah…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["ASEAN", "PBB", "OPEC", "APEC"], jawaban: "PBB" },
        { pertanyaan: "Jika 3x = 21, maka x = …", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["5", "6", "7", "8"], jawaban: "7" },
        { pertanyaan: "“They ___ happy.”", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["is", "are", "am", "be"], jawaban: "are" },
        { pertanyaan: "Fotosintesis terjadi di…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Akar", "Daun", "Batang", "Bunga"], jawaban: "Daun" },
        { pertanyaan: "Kalimat efektif adalah…", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Saya pergi dan saya membeli buku", "Saya pergi membeli buku", "Saya pergi ke membeli buku", "Saya pergi dan membeli buku-buku"], jawaban: "Saya pergi membeli buku" },
        { pertanyaan: "Negara dengan penduduk terbanyak…", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["India", "Amerika", "China", "Indonesia"], jawaban: "India" },
        { pertanyaan: "2, 6, 18, …", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["36", "48", "54", "72"], jawaban: "54" },
        { pertanyaan: "Ingat: 9 – 1 – 4 – 7. Angka pertama adalah…", kategori: "mtk", tipe: "memori", opsi: ["9", "1", "4", "7"], jawaban: "9" }
    ];

    const dataInsertUtama = daftar50Soal.map(soal => ({
        paketSoalId: paketUtama.id,
        pertanyaan: soal.pertanyaan,
        kategori: soal.kategori,
        tipe: soal.tipe,
        opsiJawaban: soal.opsi,
        jawabanBenar: soal.jawaban,
        poin: 10, // Semua 50 soal utama bernilai 10 poin dasar
        status: "belum"
    }));

    await prisma.soal.createMany({ data: dataInsertUtama });
    console.log(`   -> Berhasil memasukkan 50 soal ke dalam ${paketUtama.nama}`);

    // ==========================================
    // 2. BUAT PAKET REBUTAN (5 SOAL)
    // ==========================================
    const paketRebutan = await prisma.paketSoal.create({
        data: { nama: "Semi Final - Rebutan", babak: 'semi_final' }
    });
    console.log(`✅ Paket dibuat: [ID: ${paketRebutan.id}] ${paketRebutan.nama}`);

    const daftarSoalRebutan = [
        { pertanyaan: "[REBUTAN] Apa ibukota provinsi Sulawesi Selatan?", jawaban: "Makassar" },
        { pertanyaan: "[REBUTAN] Berapakah hasil dari 15 × 5?", jawaban: "75" },
        { pertanyaan: "[REBUTAN] Apa lambang kimia untuk unsur Oksigen?", jawaban: "O" },
        { pertanyaan: "[REBUTAN] Siapa penemu lampu pijar?", jawaban: "Thomas Alva Edison" },
        { pertanyaan: "[REBUTAN] Berapakah akar kuadrat dari 144?", jawaban: "12" }
    ];

    const dataInsertRebutan = daftarSoalRebutan.map(soal => ({
        paketSoalId: paketRebutan.id,
        pertanyaan: soal.pertanyaan,
        kategori: "ipa", // Default kategori campuran
        tipe: "esai",
        opsiJawaban: null,
        jawabanBenar: soal.jawaban,
        poin: 20, // Sesuai aturan: soal rebutan poinnya 20 tetap tanpa taruhan
        status: "belum"
    }));

    await prisma.soal.createMany({ data: dataInsertRebutan });
    console.log(`   -> Berhasil memasukkan 5 soal ke dalam ${paketRebutan.nama}`);

    console.log("\n🎉 Seeding Data Semi Final (2 Paket) Selesai!");
}

main().catch(console.error).finally(() => prisma.$disconnect());