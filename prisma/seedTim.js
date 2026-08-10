import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🏃 Memulai seeding 12 Tim Peserta (Right and Bolt)...');

    const commonPassword = await bcrypt.hash('123', 10);
    const teamsData = [];

    for (let i = 1; i <= 12; i++) {
        const order = String(i).padStart(2, '0');

        teamsData.push({
            nama: `Tim Sekolah ${order}`,
            username: `tim_${order}`,
            password: commonPassword,
            fotoTim: `default_foto.png`,
            role: 'peserta',
            tahapAktif: 'penyisihan'
        });
    }

    await prisma.tim.createMany({
        data: teamsData,
        skipDuplicates: true,
    });

    console.log('✅ 12 Tim berhasil didaftarkan ke Database.');
    console.log('📊 Sesuai ketentuan: 12 Tim bertanding bersamaan di Babak Right and Bolt.');
}

main()
    .catch((e) => {
        console.error('❌ Terjadi kesalahan saat seeding Tim:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });