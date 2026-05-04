import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    console.log('🧹 Membersihkan data Paket Soal dan Soal lama (HANYA BABAK SEMI FINAL)...');

    const paketSemiFinalLama = await prisma.paketSoal.findMany({ where: { babak: 'semi_final' } });
    const idPaketSemi = paketSemiFinalLama.map(p => p.id);

    if (idPaketSemi.length > 0) {
        await prisma.soal.deleteMany({ where: { paketSoalId: { in: idPaketSemi } } });
        await prisma.paketSoal.deleteMany({ where: { id: { in: idPaketSemi } } });
    }

    console.log('✨ Data Semi Final bersih! Memulai seeding soal baru (Diacak & Diformat)...');

    // ==========================================
    // 1. BUAT PAKET UTAMA SEMI FINAL
    // ==========================================
    const paketUtama = await prisma.paketSoal.create({
        data: { nama: "Semi Final - UTBK Baru", babak: 'semi_final' }
    });
    console.log(`✅ Paket dibuat: [ID: ${paketUtama.id}] ${paketUtama.nama}`);

    const daftar50Soal = [
        // --- LITERASI B. INDONESIA ---
        { pertanyaan: "Kata 'mitigasi' dalam kalimat berikut memiliki makna...\n\n'Pemerintah daerah melakukan mitigasi bencana menjelang musim hujan.'", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Pencegahan", "Penanggulangan dampak", "Pengurangan risiko", "Pemulihan keadaan", "Peringatan dini"], jawaban: "Pengurangan risiko" },
        { pertanyaan: "Penggunaan tanda baca koma (,) yang TEPAT terdapat pada kalimat...", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Dia lupa, akan janjinya padaku.", "Karena sedih, ia menangis tersedu-sedu.", "Buku itu tebal, tetapi sangat menarik dibaca.", "Mahasiswa itu rajin, sehingga selalu mendapat nilai A.", "Ayah membaca koran, di teras depan."], jawaban: "Buku itu tebal, tetapi sangat menarik dibaca." },
        { pertanyaan: "Lengkapi analogi berikut!\n\nMOBIL : BENSIN = PELARI : ...", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Makanan", "Sepatu", "Lintasan", "Piala", "Pelatih"], jawaban: "Makanan" },
        { pertanyaan: "Manakah kalimat berikut yang termasuk kalimat efektif?", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Kepada para mahasiswa diwajibkan untuk hadir tepat waktu.", "Buku itu sudah saya baca berulang kali.", "Tujuan daripada penelitian ini adalah untuk mengetahui tingkat polusi.", "Meskipun lelah, namun ia tetap menyelesaikan tugasnya.", "Bagi peserta yang membawa kendaraan harap diparkir di belakang."], jawaban: "Buku itu sudah saya baca berulang kali." },
        { pertanyaan: "Antonim (lawan kata) dari kata 'SKEPTIS' adalah...", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Ragu-ragu", "Curiga", "Yakin", "Pesimis", "Optimis"], jawaban: "Yakin" },
        { pertanyaan: "Perhatikan kalimat berikut:\n'Inovasi teknologi kecerdasan buatan telah mengubah lanskap industri modern secara radikal.'\n\nKata 'radikal' pada kalimat tersebut bersinonim dengan...", kategori: "b_indo", tipe: "pilihan_ganda", opsi: ["Sedikit demi sedikit", "Menyeluruh", "Berbahaya", "Keras", "Mendadak"], jawaban: "Menyeluruh" },

        // --- LITERASI B. INGGRIS ---
        { pertanyaan: "If the manager had received the proposal yesterday, he ___ it by now.", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["would review", "will review", "would have reviewed", "reviewed", "had reviewed"], jawaban: "would have reviewed" },
        { pertanyaan: "The word 'ubiquitous' in the following sentence is closest in meaning to...\n\n'Smartphones have become ubiquitous in modern society.'", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["Rare", "Expensive", "Omnipresent", "Obsolete", "Complicated"], jawaban: "Omnipresent" },
        { pertanyaan: "Identify the correct indirect speech:\n\nShe said, 'I am reading a book now.'", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["She said that she is reading a book now.", "She said that she was reading a book then.", "She said that she had been reading a book then.", "She said that I am reading a book now.", "She said she was reading a book now."], jawaban: "She said that she was reading a book then." },
        { pertanyaan: "Not only ___ the competition, but she also broke the national record.", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["did she win", "she won", "she did win", "won she", "does she win"], jawaban: "did she win" },
        { pertanyaan: "The new bridge, ___ was built last year, has already started showing cracks.", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["who", "whom", "where", "which", "whose"], jawaban: "which" },
        { pertanyaan: "What is the opposite meaning of the word 'diligent'?", kategori: "b_inggris", tipe: "pilihan_ganda", opsi: ["Hardworking", "Careful", "Lethargic", "Smart", "Persistent"], jawaban: "Lethargic" },

        // --- PENGETAHUAN KUANTITATIF (MATEMATIKA DASAR) ---
        { pertanyaan: "Jika x dan y adalah bilangan bulat positif yang memenuhi:\n- x + y = 10\n- xy = 21\n\nMaka nilai mutlak dari |x - y| adalah...", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["2", "3", "4", "5", "6"], jawaban: "4" },
        { pertanyaan: "Diketahui matriks A = [[2, x], [y, 4]] dan matriks B = [[1, 3], [2, 5]].\n\nJika determinan matriks AB adalah 10, maka nilai dari 8 - (xy) adalah...", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["-2", "0", "10", "18", "20"], jawaban: "18" },
        { pertanyaan: "Dalam sebuah ruangan terdapat 10 orang yang saling berjabat tangan satu sama lain tepat satu kali.\n\nBerapa banyak jabat tangan yang terjadi secara keseluruhan?", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["45", "50", "90", "100", "120"], jawaban: "45" },
        { pertanyaan: "Akar-akar persamaan kuadrat 2x² - 6x + m = 0 adalah p dan q.\n\nJika p² + q² = 5, maka nilai m adalah...", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["1", "2", "3", "4", "5"], jawaban: "2" },
        { pertanyaan: "Peluang hujan pada hari Senin adalah 0,6 dan peluang hujan pada hari Selasa adalah 0,4.\n\nPeluang tidak hujan pada kedua hari tersebut adalah...", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["0,16", "0,24", "0,36", "0,48", "0,76"], jawaban: "0,24" },
        { pertanyaan: "Suku ke-n dari suatu barisan geometri dirumuskan dengan Un = 3 × 2^(n-1).\n\nJumlah 5 suku pertama barisan tersebut adalah...", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["93", "96", "189", "192", "381"], jawaban: "93" },

        // --- PENALARAN UMUM (LOGIKA) ---
        { pertanyaan: "Premis 1: Jika hari hujan, maka jalanan licin.\nPremis 2: Jika jalanan licin, maka banyak kecelakaan.\nFakta: Saat ini tidak banyak kecelakaan.\n\nKesimpulannya adalah...", kategori: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["Hari hujan.", "Jalanan licin.", "Hari tidak hujan.", "Hari hujan dan banyak kecelakaan.", "Tidak ada kesimpulan yang sah."], jawaban: "Hari tidak hujan." },
        { pertanyaan: "Premis 1: Semua mahasiswa di kelas A pandai coding.\nPremis 2: Sebagian yang pandai coding juga pandai desain.\n\nKesimpulan yang tepat adalah...", kategori: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["Semua mahasiswa kelas A pandai desain.", "Sebagian mahasiswa kelas A pandai desain.", "Semua yang pandai desain adalah mahasiswa kelas A.", "Tidak ada mahasiswa kelas A yang pandai desain.", "Ada yang pandai coding namun bukan mahasiswa kelas A."], jawaban: "Ada yang pandai coding namun bukan mahasiswa kelas A." },
        { pertanyaan: "Diberikan deret angka berikut:\n2, 5, 10, 17, 26, ...\n\nAngka selanjutnya dari pola tersebut adalah...", kategori: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["35", "37", "39", "41", "45"], jawaban: "37" },
        { pertanyaan: "Toko A memberikan diskon 20% kemudian tambahan diskon 10% untuk buku.\nToko B memberikan diskon 15% kemudian tambahan diskon 15% untuk buku yang sama.\n\nJika harga awal sama, maka...", kategori: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["Harga akhir di Toko A lebih murah.", "Harga akhir di Toko B lebih murah.", "Harga akhir di kedua toko sama.", "Toko B lebih menguntungkan penjual.", "Tidak bisa ditentukan."], jawaban: "Harga akhir di Toko B lebih murah." },
        { pertanyaan: "Lima orang (P, Q, R, S, T) duduk melingkar dengan syarat:\n- P bersebelahan dengan Q.\n- R tidak bersebelahan dengan P maupun Q.\n- S duduk di sebelah kanan R.\n\nSiapa yang duduk di antara Q dan R?", kategori: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["P", "S", "T", "Tidak ada", "P dan T"], jawaban: "T" },
        { pertanyaan: "Jika X > Y dan Y < Z, maka pernyataan yang PASTI BENAR adalah...", kategori: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["X > Z", "X < Z", "Z > X", "Y adalah yang terkecil", "X dan Z sama besar"], jawaban: "Y adalah yang terkecil" },

        // --- SAINTEK: FISIKA ---
        { pertanyaan: "Benda bermassa 5 kg ditarik dengan gaya mendatar 20 N di atas lantai kasar.\n\nJika koefisien gesek kinetis = 0,2 dan g = 10 m/s², percepatan benda adalah...", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["1 m/s²", "2 m/s²", "3 m/s²", "4 m/s²", "Benda tidak bergerak"], jawaban: "2 m/s²" },
        { pertanyaan: "Dua muatan q₁ = 4 μC dan q₂ = 9 μC terpisah sejauh 10 cm.\n\nLetak sebuah titik yang kuat medan listriknya nol dari muatan q₁ berada pada jarak...", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["2 cm", "4 cm", "5 cm", "6 cm", "8 cm"], jawaban: "4 cm" },
        { pertanyaan: "Sebuah transformator step-up memiliki efisiensi 80%.\n\nJika daya masukan 100 Watt dan tegangan keluaran 200 V, berapakah kuat arus keluarannya?", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["0,2 A", "0,4 A", "0,5 A", "0,8 A", "1,0 A"], jawaban: "0,4 A" },
        { pertanyaan: "Gas ideal berekspansi secara isotermal dari volume V menjadi 2V.\n\nDalam proses ini...", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Suhu gas naik", "Tekanan gas menjadi setengahnya", "Energi dalam gas bertambah", "Gas tidak menyerap kalor", "Tekanan gas tetap"], jawaban: "Tekanan gas menjadi setengahnya" },

        // --- SAINTEK: KIMIA ---
        { pertanyaan: "Suatu larutan penyangga terdiri dari campuran CH₃COOH 0,1 M dan CH₃COONa 0,1 M.\n\nJika Ka CH₃COOH = 10⁻⁵, berapakah pH larutan tersebut?", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["4", "5", "6", "8", "9"], jawaban: "5" },
        { pertanyaan: "Diketahui reaksi pembentukan gas amonia:\nN₂(g) + 3H₂(g) ⇌ 2NH₃(g) dengan ΔH = -92 kJ.\n\nUntuk memperbanyak hasil amonia, tindakan yang paling tepat adalah...", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Menaikkan suhu", "Menambah katalisator", "Menurunkan tekanan ruang", "Memperbesar volume ruang", "Menurunkan suhu"], jawaban: "Menurunkan suhu" },
        { pertanyaan: "Konfigurasi elektron ion X³⁺ adalah [Ar] 3d⁵.\n\nAtom X dalam sistem periodik terletak pada golongan dan periode...", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["VIII B, periode 4", "V B, periode 4", "III B, periode 3", "V B, periode 3", "VIII A, periode 4"], jawaban: "VIII B, periode 4" },
        { pertanyaan: "Oksidasi alkohol primer menggunakan kalium dikromat (K₂Cr₂O₇) bersuasana asam akan menghasilkan senyawa golongan...", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Keton", "Ester", "Eter", "Aldehid lalu Asam Karboksilat", "Alkana"], jawaban: "Aldehid lalu Asam Karboksilat" },

        // --- SAINTEK: BIOLOGI ---
        { pertanyaan: "Organel sel yang berfungsi sebagai tempat berlangsungnya respirasi seluler untuk menghasilkan energi (ATP) adalah...", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Badan Golgi", "Retikulum Endoplasma", "Lisosom", "Mitokondria", "Nukleus"], jawaban: "Mitokondria" },
        { pertanyaan: "Seorang laki-laki buta warna menikah dengan wanita normal carrier.\n\nPersentase kemungkinan anak laki-laki mereka mengalami buta warna adalah...", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["0%", "25%", "50%", "75%", "100%"], jawaban: "50%" },
        { pertanyaan: "Proses pemecahan glikogen menjadi glukosa yang terjadi di dalam organ hati dirangsang oleh hormon...", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Insulin", "Adrenalin", "Glukagon", "Tiroksin", "Oksitosin"], jawaban: "Glukagon" },
        { pertanyaan: "Jaringan pada tumbuhan yang selalu aktif membelah dan biasanya terletak di ujung akar serta ujung batang disebut jaringan...", kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Parenkim", "Sklerenkim", "Meristem apikal", "Kolenkim", "Xilem"], jawaban: "Meristem apikal" },

        // --- SOSHUM ---
        { pertanyaan: "Sistem Tanam Paksa (Cultuurstelsel) di Indonesia dicetuskan pada tahun 1830 oleh Gubernur Jenderal...", kategori: "sejarah", tipe: "pilihan_ganda", opsi: ["H.W. Daendels", "Thomas Stamford Raffles", "Johannes van den Bosch", "J.P. Coen", "Cornelis de Houtman"], jawaban: "Johannes van den Bosch" },
        { pertanyaan: "Prasasti Yupa peninggalan Kerajaan Kutai yang menggunakan huruf Pallawa dan bahasa Sanskerta, secara spesifik menceritakan tentang...", kategori: "sejarah", tipe: "pilihan_ganda", opsi: ["Pembangunan candi", "Silsilah raja-raja Tarumanegara", "Kedermawanan Raja Mulawarman yang menyedekahkan 20.000 ekor sapi", "Kutukan bagi yang menentang raja", "Perluasan wilayah maritim"], jawaban: "Kedermawanan Raja Mulawarman yang menyedekahkan 20.000 ekor sapi" },
        { pertanyaan: "Fenomena El Nino yang terjadi di Indonesia umumnya menyebabkan dampak berupa...", kategori: "geografi", tipe: "pilihan_ganda", opsi: ["Musim hujan berkepanjangan", "Suhu udara menurun drastis", "Terjadinya kemarau panjang dan kekeringan", "Angin puting beliung di pesisir", "Peningkatan jumlah ikan tangkapan nelayan"], jawaban: "Terjadinya kemarau panjang dan kekeringan" },
        { pertanyaan: "Pola pemukiman penduduk yang berada di kawasan daerah pegunungan kapur (karst) umumnya berbentuk...", kategori: "geografi", tipe: "pilihan_ganda", opsi: ["Memanjang (linier)", "Memusat (radial)", "Menyebar (dispersed)", "Mengelompok padat", "Sejajar jalan raya"], jawaban: "Menyebar (dispersed)" },
        { pertanyaan: "Asimilasi sebagai bentuk interaksi sosial disosiatif memiliki ciri utama yaitu...", kategori: "sosiologi", tipe: "pilihan_ganda", opsi: ["Mempertahankan kebudayaan asli", "Peleburan dua budaya yang menghasilkan budaya baru", "Penguasaan budaya kuat terhadap budaya lemah", "Penolakan terhadap budaya asing", "Peniruan budaya asing tanpa modifikasi"], jawaban: "Peleburan dua budaya yang menghasilkan budaya baru" },
        { pertanyaan: "Seorang anak petani desa berhasil sukses menjadi pengusaha besar dan pindah ke kota.\n\nBentuk mobilitas sosial yang dialaminya adalah...", kategori: "sosiologi", tipe: "pilihan_ganda", opsi: ["Mobilitas vertikal naik antargenerasi", "Mobilitas horizontal", "Mobilitas vertikal turun", "Mobilitas intragenerasi naik", "Mobilitas geografis murni"], jawaban: "Mobilitas vertikal naik antargenerasi" },
        { pertanyaan: "Menurut UUD 1945 Pasal 1 ayat 3, secara tegas dinyatakan bahwa Negara Indonesia adalah negara...", kategori: "pkn", tipe: "pilihan_ganda", opsi: ["Kesatuan", "Republik", "Hukum", "Demokrasi", "Berdaulat"], jawaban: "Hukum" },
        { pertanyaan: "Jika harga barang X naik, maka permintaan terhadap barang Y (yang merupakan barang substitusi X) akan...", kategori: "ekonomi", tipe: "pilihan_ganda", opsi: ["Turun", "Tetap", "Naik", "Tidak bisa diprediksi", "Menjadi elastis"], jawaban: "Naik" },
        { pertanyaan: "Dalam kurva penawaran, pergeseran kurva secara keseluruhan ke arah kanan dapat disebabkan oleh faktor...", kategori: "ekonomi", tipe: "pilihan_ganda", opsi: ["Kenaikan harga bahan baku", "Kenaikan pajak produksi", "Penurunan jumlah produsen", "Kemajuan teknologi produksi", "Penurunan daya beli masyarakat"], jawaban: "Kemajuan teknologi produksi" },

        // --- CAMPURAN ---
        { pertanyaan: "Pancasila secara resmi disahkan sebagai dasar negara pada tanggal...", kategori: "pkn", tipe: "pilihan_ganda", opsi: ["1 Juni 1945", "17 Agustus 1945", "18 Agustus 1945", "22 Juni 1945", "1 Oktober 1945"], jawaban: "18 Agustus 1945" },
        { pertanyaan: "Pada masa Demokrasi Terpimpin, Presiden Soekarno mengeluarkan Dekrit Presiden yang berisi beberapa hal berikut, KECUALI...", kategori: "sejarah", tipe: "pilihan_ganda", opsi: ["Pembubaran Konstituante", "Berlakunya kembali UUD 1945", "Tidak berlakunya UUDS 1950", "Pembentukan MPRS dan DPAS", "Pelaksanaan Pemilihan Umum pertama"], jawaban: "Pelaksanaan Pemilihan Umum pertama" },
        { pertanyaan: "Lapisan atmosfer tempat di mana terjadinya berbagai fenomena cuaca (seperti hujan, petir, dan angin) adalah lapisan...", kategori: "geografi", tipe: "pilihan_ganda", opsi: ["Stratosfer", "Mesosfer", "Troposfer", "Termosfer", "Eksosfer"], jawaban: "Troposfer" },
        { pertanyaan: "Tentukan nilai dari limit berikut:\n\nLimit x → 2 dari [(x² - 4) / (x - 2)]", kategori: "mtk", tipe: "pilihan_ganda", opsi: ["0", "2", "4", "8", "Tidak terdefinisi"], jawaban: "4" },
        { pertanyaan: "Sistem pemerintahan di mana kekuasaan eksekutif bertanggung jawab penuh kepada badan legislatif (parlemen) disebut sistem...", kategori: "pkn", tipe: "pilihan_ganda", opsi: ["Presidensial", "Parlementer", "Monarki Konstitusional", "Demokrasi Langsung", "Oligarki"], jawaban: "Parlementer" }
    ];

    const soalUtamaDiacak = shuffleArray([...daftar50Soal]);

    const dataInsertUtama = soalUtamaDiacak.map(soal => ({
        paketSoalId: paketUtama.id,
        pertanyaan: soal.pertanyaan,
        kategori: soal.kategori,
        tipe: soal.tipe,
        opsiJawaban: soal.opsi,
        jawabanBenar: soal.jawaban,
        poin: 10,
        status: "belum"
    }));

    await prisma.soal.createMany({ data: dataInsertUtama });
    console.log(`   -> Berhasil memasukkan ${dataInsertUtama.length} soal ke dalam ${paketUtama.nama} secara ACAK.`);

    // ==========================================
    // 2. BUAT PAKET REBUTAN SEMI FINAL
    // ==========================================
    const paketRebutan = await prisma.paketSoal.create({
        data: { nama: "Semi Final - Rebutan UTBK", babak: 'semi_final' }
    });
    console.log(`✅ Paket dibuat: [ID: ${paketRebutan.id}] ${paketRebutan.nama}`);

    const daftarSoalRebutan = [
        {
            pertanyaan: "Dalam sebuah barisan aritmatika, jumlah suku ke-4 dan suku ke-8 adalah 30.\n\nJika suku ke-6 dilambangkan dengan x, maka nilai dari (x² - 10) adalah...",
            kategori: "mtk", tipe: "pilihan_ganda", opsi: ["195", "205", "215", "225", "235"], jawaban: "215"
        },
        {
            pertanyaan: "Perhatikan reaksi redoks berikut (belum setara):\n\na MnO₄⁻ + b H₂S + c H⁺ → d Mn²⁺ + e S + f H₂O\n\nNilai koefisien a, b, dan c yang paling tepat setelah persamaan disetarakan adalah...",
            kategori: "ipa", tipe: "pilihan_ganda", opsi: ["2, 5, 6", "2, 5, 16", "2, 3, 8", "1, 5, 8", "2, 5, 8"], jawaban: "2, 5, 16"
        },
        {
            pertanyaan: "Hukum Mendel II (hukum asortasi atau pengelompokan secara bebas) terjadi pada tahapan pembelahan sel secara meiosis, tepatnya pada fase...",
            kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Profase I", "Metafase I", "Anafase I", "Metafase II", "Anafase II"], jawaban: "Metafase I"
        },
        {
            pertanyaan: "Jika si A menyangkal bahwa ia TIDAK mengetahui kejadian perampokan tersebut, dan si B mengatakan bahwa A berbohong.\n\nMaka secara logika, fakta yang sebenarnya adalah...",
            kategori: "penalaran_umum", tipe: "pilihan_ganda", opsi: ["A mengetahui kejadian tersebut", "A tidak mengetahui kejadian tersebut", "B mengetahui kejadian tersebut", "B adalah perampoknya", "Keduanya tidak tahu menahu"], jawaban: "A mengetahui kejadian tersebut"
        },
        {
            pertanyaan: "Sebuah partikel bergerak melingkar beraturan dengan jari-jari lintasan sebesar R.\n\nJika kecepatan liniernya dijadikan dua kali lipat, maka gaya sentripetal partikel tersebut akan menjadi...",
            kategori: "ipa", tipe: "pilihan_ganda", opsi: ["Sama seperti semula", "Dua kali semula", "Empat kali semula", "Setengah kali semula", "Seperempat kali semula"], jawaban: "Empat kali semula"
        }
    ];

    const soalRebutanDiacak = shuffleArray([...daftarSoalRebutan]);

    const dataInsertRebutan = soalRebutanDiacak.map(soal => ({
        paketSoalId: paketRebutan.id,
        pertanyaan: soal.pertanyaan,
        kategori: soal.kategori,
        tipe: soal.tipe,
        opsiJawaban: soal.opsi,
        jawabanBenar: soal.jawaban,
        poin: 20,
        status: "belum"
    }));

    await prisma.soal.createMany({ data: dataInsertRebutan });
    console.log(`   -> Berhasil memasukkan ${dataInsertRebutan.length} soal ke dalam ${paketRebutan.nama} secara ACAK.`);

    console.log("\n🎉 Seeding Data Semi Final Selesai!");
}

main().catch(console.error).finally(() => prisma.$disconnect());