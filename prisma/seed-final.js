import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fungsi untuk mengacak array (Fisher-Yates Shuffle)
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

async function main() {
    console.log('🧹 Membersihkan data Final lama (HANYA BABAK FINAL)...');

    const paketFinalLama = await prisma.paketSoal.findMany({ where: { babak: 'final' } });
    const idPaketFinal = paketFinalLama.map(p => p.id);

    if (idPaketFinal.length > 0) {
        await prisma.soal.deleteMany({ where: { paketSoalId: { in: idPaketFinal } } });
        await prisma.paketSoal.deleteMany({ where: { id: { in: idPaketFinal } } });
    }

    console.log('✨ Data Final bersih! Memulai proses seeding 4 Game Final UTBK (Diacak & Diformat)...');

    // ==========================================
    // GAME 1: RnB (17 Soal Pilihan Ganda & Esai)
    // ==========================================
    const paketRnB = await prisma.paketSoal.create({ data: { nama: "Final - Game 1 (RnB)", babak: 'final' } });
    const soalRnBAsli = [
        { q: "Sebuah benda dilempar vertikal ke atas dengan kecepatan awal 20 m/s.\n\nJika percepatan gravitasi (g) = 10 m/s², tinggi maksimum yang dicapai benda tersebut adalah...", cat: "ipa", tipe: "pilihan_ganda", opsi: ["10 m", "15 m", "20 m", "25 m", "40 m"], ans: "20 m" },
        { q: "Diketahui persamaan eksponen:\n3^x + 3^(x+1) = 36\n\nMaka nilai dari x² adalah...", cat: "mtk", tipe: "pilihan_ganda", opsi: ["1", "4", "9", "16", "25"], ans: "4" },
        { q: "Kata 'anomali' dalam teks berkonteks sains paling tepat bersinonim dengan...", cat: "b_indo", tipe: "pilihan_ganda", opsi: ["Kesesuaian", "Penyimpangan", "Keunikan", "Keteraturan", "Persamaan"], ans: "Penyimpangan" },
        { q: "Perhatikan premis berikut:\n1. Semua dokter adalah tenaga medis.\n2. Sebagian tenaga medis memakai kacamata.\n\nBerdasarkan premis di atas, kesimpulan yang paling tepat adalah...", cat: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["Semua dokter memakai kacamata", "Sebagian dokter memakai kacamata", "Tidak ada dokter yang memakai kacamata", "Semua yang memakai kacamata adalah dokter", "Tidak dapat ditarik kesimpulan pasti"], ans: "Tidak dapat ditarik kesimpulan pasti" },
        { q: "The findings of the study reveal a ___ correlation between stress and cognitive decline.", cat: "b_inggris", tipe: "pilihan_ganda", opsi: ["negligible", "compelling", "trivial", "obscure", "frivolous"], ans: "compelling" },
        { q: "Dalam suatu deret geometri tak hingga, suku pertama adalah 10 dan jumlah tak hingganya adalah 20.\n\nRasio dari deret tersebut adalah...", cat: "mtk", tipe: "pilihan_ganda", opsi: ["1/4", "1/3", "1/2", "2/3", "3/4"], ans: "1/2" },
        { q: "Ion X²⁺ memiliki konfigurasi elektron [Ar] 3d⁵.\n\nAtom X dalam sistem periodik terletak pada golongan dan periode...", cat: "ipa", tipe: "pilihan_ganda", opsi: ["VII B, periode 4", "V B, periode 4", "VII A, periode 3", "V A, periode 4", "III B, periode 4"], ans: "VII B, periode 4" },
        { q: "Manakah di antara kalimat berikut yang menggunakan ejaan dan kata baku bahasa Indonesia secara tepat?", cat: "b_indo", tipe: "pilihan_ganda", opsi: ["Ia membeli obat di apotik.", "Jadual pertandingannya diundur esok hari.", "Analisis data memakan waktu lama.", "Hakekatnya semua manusia sama.", "Ia bekerja secara sistematis dan hirarki."], ans: "Analisis data memakan waktu lama." },
        { q: "Organel sel yang memiliki enzim hidrolitik dan berfungsi mengatur apoptosis (kematian sel terprogram) adalah...", cat: "ipa", tipe: "pilihan_ganda", opsi: ["Nukleus", "Lisosom", "Mitokondria", "Ribosom", "Badan Golgi"], ans: "Lisosom" },
        { q: "Not only ___ late, but she also forgot her assignment.", cat: "b_inggris", tipe: "pilihan_ganda", opsi: ["she was", "was she", "she is", "is she", "she did"], ans: "was she" },
        { q: "Diketahui fungsi:\nf(x) = 2x - 3\ng(x) = x² + 1\n\nNilai dari komposisi fungsi (g ∘ f)(2) adalah...", cat: "mtk", tipe: "esai", opsi: null, ans: "2" },
        { q: "Dua buah dadu dilempar undi secara bersamaan.\n\nPeluang munculnya mata dadu berjumlah 7 atau 10 adalah...", cat: "mtk", tipe: "pilihan_ganda", opsi: ["1/6", "1/4", "1/3", "5/12", "7/36"], ans: "1/4" },
        { q: "Dampak utama dari pergerakan konvergensi (tumbukan) antara lempeng samudra dan lempeng benua adalah...", cat: "geografi", tipe: "pilihan_ganda", opsi: ["Terbentuknya palung laut", "Terbentuknya mid-oceanic ridge", "Terjadinya sesar mendatar", "Terbentuknya pulau atol", "Meluasnya kerak samudra"], ans: "Terbentuknya palung laut" },
        { q: "Sikap mementingkan diri sendiri secara berlebihan dan mengabaikan kepentingan masyarakat dalam sosiologi dikenal sebagai...", cat: "sosiologi", tipe: "pilihan_ganda", opsi: ["Hedonisme", "Chauvinisme", "Egosentrisme", "Etnosentrisme", "Sekularisme"], ans: "Egosentrisme" },
        { q: "Perhatikan barisan bilangan berikut:\n4, 7, 14, 17, 34, 37, ...\n\nAngka selanjutnya dari pola di atas adalah...", cat: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["40", "64", "70", "74", "80"], ans: "74" },
        { q: "Berapakah pH campuran dari larutan berikut:\n- 100 mL HCl 0,1 M\n- 100 mL NaOH 0,1 M", cat: "ipa", tipe: "pilihan_ganda", opsi: ["1", "3", "5", "7", "9"], ans: "7" },
        { q: "Menurut hukum permintaan dan penawaran silang, jika harga barang substitusi naik, maka permintaan barang utama akan...", cat: "ekonomi", tipe: "pilihan_ganda", opsi: ["Turun", "Tetap", "Meningkat", "Fluktuatif", "Menjadi elastis sempurna"], ans: "Meningkat" }
    ];

    const soalRnBDiacak = shuffleArray([...soalRnBAsli]);
    await prisma.soal.createMany({
        data: soalRnBDiacak.map((s, i) => ({
            paketSoalId: paketRnB.id,
            pertanyaan: `[RnB ${i + 1}]\n${s.q}`,
            kategori: s.cat,
            tipe: s.tipe,
            opsiJawaban: s.opsi,
            jawabanBenar: s.ans,
            poin: 25,
            status: "belum"
        }))
    });
    console.log(`✅ [Game 1] Berhasil memasukkan 17 soal ke ${paketRnB.nama}`);

    // ==========================================
    // GAME 2: SCORE BATTLE (20 Soal Pilihan Ganda)
    // ==========================================
    const paketScore = await prisma.paketSoal.create({ data: { nama: "Final - Game 2 (Score Battle)", babak: 'final' } });
    const soalScoreAsli = [
        { q: "Tentukan nilai dari limit berikut:\n\nLimit x → 0 [(sin 4x) / (tan 2x)]", cat: "mtk", opsi: ["1/2", "1", "2", "4", "8"], ans: "2" },
        { q: "Jika harga keseimbangan (equilibrium) tercapai, maka keadaan pasar menunjukkan...", cat: "ekonomi", opsi: ["Kelebihan penawaran", "Kelebihan permintaan", "Kurva supply dan demand berpotongan", "Harga terus berfluktuasi", "Pemerintah melakukan intervensi"], ans: "Kurva supply dan demand berpotongan" },
        { q: "Gaya sentripetal pada benda yang bergerak melingkar beraturan berfungsi untuk...", cat: "ipa", opsi: ["Mengubah kelajuan benda", "Mengubah arah kecepatan linear", "Mempertahankan energi mekanik", "Mengurangi gesekan udara", "Meningkatkan kecepatan angular"], ans: "Mengubah arah kecepatan linear" },
        { q: "Penggunaan imbuhan dan kata bentukan yang TEPAT terdapat pada kalimat...", cat: "b_indo", opsi: ["Mereka sedang memproklamirkan kemerdekaan.", "Polisi menilang pengendara motor itu.", "Pabrik itu memroduksi sepatu kulit.", "Dia mengonsumsi vitamin setiap hari.", "Kami mensukseskan acara tersebut."], ans: "Dia mengonsumsi vitamin setiap hari." },
        { q: "If he had known the truth, he ___ her.", cat: "b_inggris", opsi: ["will tell", "would tell", "would have told", "told", "had told"], ans: "would have told" },
        { q: "Pernyataan yang TIDAK TEPAT mengenai proses pembelahan mitosis adalah...", cat: "ipa", opsi: ["Terjadi pada sel somatik", "Menghasilkan 2 sel anak", "Sifat sel anak diploid (2n)", "Terjadi pindah silang (crossing over)", "Berfungsi untuk pertumbuhan"], ans: "Terjadi pindah silang (crossing over)" },
        { q: "Perjanjian Linggarjati antara delegasi Indonesia dan Belanda menghasilkan pengakuan secara de facto atas wilayah...", cat: "sejarah", opsi: ["Sumatra, Jawa, Madura", "Sumatra, Jawa, Bali", "Seluruh Nusantara", "Jawa dan Sulawesi", "Jawa, Madura, Kalimantan"], ans: "Sumatra, Jawa, Madura" },
        { q: "Diketahui fungsi f(x) = (2x - 1)³.\n\nTurunan pertama dari f(x) adalah...", cat: "mtk", opsi: ["3(2x - 1)²", "6(2x - 1)²", "2(2x - 1)²", "6x(2x - 1)²", "(2x - 1)²"], ans: "6(2x - 1)²" },
        { q: "Ikatan kimia yang terjadi antara unsur dengan nomor atom 11 (Na) dan unsur dengan nomor atom 17 (Cl) adalah...", cat: "ipa", opsi: ["Kovalen polar", "Kovalen nonpolar", "Ion", "Logam", "Hidrogen"], ans: "Ion" },
        { q: "Di antara kota-kota berikut, manakah yang perbedaan waktunya dengan Greenwich Mean Time (GMT) adalah +8 jam?", cat: "geografi", opsi: ["Jakarta", "Medan", "Makassar", "Jayapura", "Ambon"], ans: "Makassar" },
        { q: "Nilai rata-rata ujian matematika dari 4 siswa adalah 85.\nJika nilai Budi digabungkan, nilai rata-ratanya naik menjadi 86.\n\nBerapakah nilai ujian Budi?", cat: "mtk", opsi: ["86", "88", "90", "92", "94"], ans: "90" },
        { q: "Pemakaian tanda baca (koma, titik, koma titik) yang BENAR terdapat pada kalimat...", cat: "b_indo", opsi: ["Oleh karena itu kita harus waspada.", "Akan tetapi, dia tidak datang.", "Meskipun hujan, tetapi ia pergi.", "Selain itu; ia juga cerdas.", "Namun. ia gagal dalam ujian."], ans: "Akan tetapi, dia tidak datang." },
        { q: "Which word is synonymous with 'mitigate'?", cat: "b_inggris", opsi: ["Aggravate", "Alleviate", "Instigate", "Irritate", "Elongate"], ans: "Alleviate" },
        { q: "Keanekaragaman hayati tingkat ekosistem terbentuk akibat adanya interaksi yang kompleks antara...", cat: "ipa", opsi: ["Gen dan kromosom", "Faktor abiotik dan genetik", "Sesama komponen biotik", "Populasi dan komunitas", "Komponen biotik dan abiotik"], ans: "Komponen biotik dan abiotik" },
        { q: "Bentuk sederhana dari:\nlog 5 + log 2\n\nadalah...", cat: "mtk", opsi: ["log 3", "log 7", "1", "10", "log 2.5"], ans: "1" },
        { q: "Dalam struktur sosial kemasyarakatan, sistem kasta di Bali merupakan contoh dari stratifikasi sosial yang bersifat...", cat: "sosiologi", opsi: ["Terbuka", "Tertutup", "Campuran", "Vertikal naik", "Horizontal"], ans: "Tertutup" },
        { q: "Tegangan listrik bolak-balik (Alternating Current) diukur menggunakan alat...", cat: "ipa", opsi: ["Amperemeter", "Voltmeter AC", "Ohm meter", "Galvanometer", "Wattmeter"], ans: "Voltmeter AC" },
        { q: "Sebuah dadu bersisi enam dilempar sebanyak 1 kali.\n\nPeluang munculnya mata dadu bilangan prima ganjil adalah...", cat: "mtk", opsi: ["1/6", "1/3", "1/2", "2/3", "5/6"], ans: "1/3" },
        { q: "Diketahui dua pernyataan logika:\n- P > Q\n- Q = R\n\nMaka pernyataan di bawah ini yang pasti BENAR adalah...", cat: "penalaran_umum", opsi: ["P < R", "P = R", "P > R", "Q > R", "P dan R tidak dapat ditentukan"], ans: "P > R" },
        { q: "Reaksi hidrolisis garam yang terbentuk dari campuran asam lemah dan basa kuat akan menghasilkan larutan yang bersifat...", cat: "ipa", opsi: ["Asam", "Basa", "Netral", "Amfoter", "Tidak bereaksi"], ans: "Basa" }
    ];

    const soalScoreDiacak = shuffleArray([...soalScoreAsli]);
    await prisma.soal.createMany({
        data: soalScoreDiacak.map((s, i) => ({
            paketSoalId: paketScore.id,
            pertanyaan: `[SCORE BATTLE ${i + 1}]\n${s.q}`,
            kategori: s.cat,
            tipe: "pilihan_ganda",
            opsiJawaban: s.opsi,
            jawabanBenar: s.ans,
            poin: 10,
            status: "belum"
        }))
    });
    console.log(`✅ [Game 2] Berhasil memasukkan 20 soal ke ${paketScore.nama}`);

    // ==========================================
    // GAME 3: COLLABORATIVE (30 Soal ESAI SINGKAT)
    // ==========================================
    const paketCollab = await prisma.paketSoal.create({ data: { nama: "Final - Game 3 (Collaborative)", babak: 'final' } });

    const soalCollabAsli = [
        { q: "Diketahui fungsi f(x):\ny = 5x³ - 2x\n\nBerapakah turunan pertamanya (y')?", cat: "mtk", ans: "15x² - 2" },
        { q: "Diketahui:\nAr C = 12\nAr O = 16\n\nBerapa massa molekul relatif (Mr) dari gas karbon dioksida (CO₂)?", cat: "ipa", ans: "44" },
        { q: "Organel sel pada tumbuhan yang mengandung pigmen hijau dan berfungsi sebagai tempat berlangsungnya fotosintesis adalah...", cat: "ipa", ans: "Kloroplas" },
        { q: "Siapakah ilmuwan pencetus teori heliosentris yang menyatakan bahwa matahari adalah pusat tata surya (bukan bumi)?", cat: "ipa", ans: "Nicolaus Copernicus" },
        { q: "Tuliskan sinonim (persamaan kata) yang paling tepat dari kata 'EKSKAVASI'!", cat: "b_indo", ans: "Penggalian" },
        { q: "What is the past participle (Verb 3) form of the irregular verb 'sing'?", cat: "b_inggris", ans: "Sung" },
        { q: "Diketahui sistem persamaan linear:\nx + y = 10\nx - y = 4\n\nBerapakah hasil kali dari x dan y (x × y)?", cat: "mtk", ans: "21" },
        { q: "Peristiwa perpindahan panas yang diikuti oleh perpindahan pergerakan partikel zat perantaranya (seperti merebus air) disebut...", cat: "ipa", ans: "Konveksi" },
        { q: "Dalam sejarah proklamasi, Badan Penyelidik Usaha-usaha Persiapan Kemerdekaan Indonesia biasa disingkat menjadi...", cat: "sejarah", ans: "BPUPKI" },
        { q: "Bentuk sederhana dan hasil penjumlahan dari:\nlog 1000 + log 100\n\nadalah...", cat: "mtk", ans: "5" },

        { q: "Di dalam sebuah kelas terdapat 5 calon pengurus. Akan dipilih 2 orang untuk menempati posisi ketua dan wakil.\n\nBerapakah hasil dari permutasi P(5,2)?", cat: "mtk", ans: "20" },
        { q: "Senyawa asam lambung manusia pada dasarnya didominasi oleh asam kuat.\n\nTuliskan rumus kimia dari asam lambung tersebut!", cat: "ipa", ans: "HCl" },
        { q: "Sebutkan nama benua terkering, paling datar, dan sekaligus benua terkecil di dunia!", cat: "geografi", ans: "Australia" },
        { q: "Tuliskan lawan kata (antonim) yang paling tepat dari istilah logika 'APRIORI'!", cat: "b_indo", ans: "Aposteriori" },
        { q: "Garis lintang 0 derajat yang membelah bumi secara horizontal menjadi kutub utara dan kutub selatan disebut garis...", cat: "geografi", ans: "Khatulistiwa" },
        { q: "Jika diketahui fungsi linier:\nf(x) = 3x - 1\n\nBerapakah nilai dari fungsi invers f⁻¹(8)?", cat: "mtk", ans: "3" },
        { q: "Sifat gelombang cahaya yang menyebabkan terjadinya fenomena pelangi (penguraian warna putih menjadi spektrum warna) disebut...", cat: "ipa", ans: "Dispersi" },
        { q: "Zaman batu muda dalam periodisasi prasejarah manusia purba, di mana manusia mulai mengenal cocok tanam, dikenal dengan istilah...", cat: "sejarah", ans: "Neolitikum" },
        { q: "What is the noun form (kata benda) of the verb 'decide'?", cat: "b_inggris", ans: "Decision" },
        { q: "Gaya tarik-menarik antara partikel molekul yang tidak sejenis (misalnya antara tetesan air dengan permukaan kaca) disebut...", cat: "ipa", ans: "Adhesi" },

        { q: "Perhatikan matriks identitas berordo 2x2:\n[ 1  0 ]\n[ 0  1 ]\n\nBerapakah nilai determinannya?", cat: "mtk", ans: "1" },
        { q: "Proses pembuatan dan sintesis amonia dalam industri kimia secara komersial dikenal dengan nama proses...", cat: "ipa", ans: "Haber-Bosch" },
        { q: "Bentuk adaptasi fisiologis pada ikan air tawar untuk menjaga keseimbangan osmotik adalah minum sedikit air dan mengeluarkan urin yang bersifat...", cat: "ipa", ans: "Encer" },
        { q: "Majas yang membandingkan benda mati seolah-olah memiliki sifat hidup atau bertingkah laku layaknya manusia disebut majas...", cat: "b_indo", ans: "Personifikasi" },
        { q: "Lembaga negara Republik Indonesia yang berwenang menguji undang-undang (judicial review) terhadap UUD 1945 adalah...", cat: "pkn", ans: "Mahkamah Konstitusi" },
        { q: "Jika keliling sebuah persegi panjang adalah 40 cm dan panjangnya adalah 12 cm...\n\nBerapakah luas persegi panjang tersebut (dalam cm²)?", cat: "mtk", ans: "96" },
        { q: "Alat pengukur intensitas gempa bumi yang dapat menghasilkan rekaman getaran berbentuk grafik (seismogram) disebut...", cat: "geografi", ans: "Seismograf" },
        { q: "Sebutkan nama Satuan Internasional (SI) yang digunakan untuk mengukur besaran fluks magnetik!", cat: "ipa", ans: "Weber" },
        { q: "Paham atau ideologi ekonomi yang menekankan kebebasan pasar (free market) dan kepemilikan swasta murni tanpa intervensi pemerintah disebut...", cat: "ekonomi", ans: "Kapitalisme" },
        { q: "Sebuah mobil bergerak dipercepat dari keadaan diam hingga mencapai kecepatan 20 m/s dalam kurun waktu 4 detik.\n\nBerapakah percepatan mobil tersebut (dalam m/s²)?", cat: "ipa", ans: "5" }
    ];

    const soalCollabDiacak = shuffleArray([...soalCollabAsli]);
    await prisma.soal.createMany({
        data: soalCollabDiacak.map((s, i) => ({
            paketSoalId: paketCollab.id,
            pertanyaan: `[COLLAB Q-${i + 1}]\n${s.q}`,
            kategori: s.cat,
            tipe: "esai",
            opsiJawaban: null,
            jawabanBenar: s.ans,
            poin: 25,
            status: "belum"
        }))
    });
    console.log(`✅ [Game 3] Berhasil memasukkan 30 soal ESAI SINGKAT ke ${paketCollab.nama}`);

    // ==========================================
    // GAME 4: CASE BATTLE (3 Soal Esai Analisis UTBK)
    // ==========================================
    const paketCase = await prisma.paketSoal.create({ data: { nama: "Final - Game 4 (Case Battle)", babak: 'final' } });
    const soalCaseAsli = [
        { q: "Di era Society 5.0, disrupsi Artificial Intelligence (Kecerdasan Buatan) diprediksi akan menggantikan jutaan pekerjaan repetitif dan klerikal.\n\nPertanyaan Analisis Tiga Arah:\n1. Menurut pandangan tim, apakah fenomena ini merupakan ancaman krisis pengangguran atau justru peluang emas bagi ekonomi nasional?\n2. Bagaimana dampak disrupsi ini terhadap melebarnya jurang kesenjangan sosial di negara berkembang?\n3. Sebutkan satu regulasi konkrit yang harus dibuat oleh pemerintah untuk memitigasi risiko tersebut tanpa menghambat inovasi teknologi!" },
        { q: "Indonesia saat ini sedang memasuki fase 'Bonus Demografi', di mana penduduk usia produktif mendominasi piramida penduduk. Namun, momentum ini dibayangi oleh tantangan 'Fenomena Strawberry Generation' (generasi yang kreatif namun rapuh secara resiliensi mental).\n\nPertanyaan Analisis Tiga Arah:\n1. Analisis secara logis bagaimana fenomena generasi yang rapuh ini dapat menggagalkan potensi kemajuan ekonomi menuju Indonesia Emas 2045!\n2. Jelaskan korelasi antara ekspektasi sistem pendidikan saat ini dengan tekanan mental di kalangan pemuda.\n3. Rancang sebuah solusi strategis dan preventif dari perspektif kebijakan pendidikan untuk memperkuat daya lenting (resiliensi) pemuda Indonesia!" },
        { q: "Transisi menuju energi hijau (Green Energy) sedang gencar dilakukan untuk menekan emisi karbon, salah satunya melalui adopsi masif Kendaraan Listrik (EV). Di sisi lain, sumber listrik utama Indonesia di hulu masih bergantung pada Pembangkit Listrik Tenaga Uap (PLTU) yang membakar batu bara.\n\nPertanyaan Analisis Tiga Arah:\n1. Jelaskan ironi ekologis dari fenomena di atas jika ditinjau dari konsep keseluruhan 'rantai emisi karbon' (well-to-wheel)!\n2. Apa dampak ekonomi makro dari kebijakan subsidi pemerintah besar-besaran untuk kendaraan listrik yang justru menyasar masyarakat kelas menengah-atas?\n3. Apa alternatif atau tahapan solusi transisi energi yang paling rasional untuk diterapkan di Indonesia dalam 10 tahun ke depan agar tidak sekadar memindahkan titik polusi?" }
    ];

    const soalCaseDiacak = shuffleArray([...soalCaseAsli]);
    await prisma.soal.createMany({
        data: soalCaseDiacak.map((s, i) => ({
            paketSoalId: paketCase.id,
            pertanyaan: `[CASE BATTLE ${i + 1}]\n${s.q}`,
            kategori: "penalaran_umum",
            tipe: "esai",
            opsiJawaban: null,
            jawabanBenar: "Penilaian Juri (Berdasarkan Argumen Berpikir Kritis, Keterkaitan Logika, dan Solusi Konkrit)",
            poin: 0,
            status: "belum"
        }))
    });
    console.log(`✅ [Game 4] Berhasil memasukkan 3 soal Studi Kasus ke ${paketCase.nama}`);

    console.log("\n🎉 Seeding Data Grand Final Selesai! Database siap untuk Partai Puncak.");
}

main()
    .catch((e) => {
        console.error('❌ Terjadi kesalahan saat seeding Soal Final:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });