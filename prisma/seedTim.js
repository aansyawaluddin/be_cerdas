import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🏃 Memulai seeding 24 Tim Peserta...');

    const commonPassword = await bcrypt.hash('123', 10);
    const teamsData = [];

    for (let i = 1; i <= 24; i++) {
        const grupId = Math.floor((i - 1) / 12) + 1;
        const order = String(i).padStart(2, '0');

        teamsData.push({
            nama: `Tim Sekolah ${order}`,
            username: `tim_${order}`,
            password: commonPassword,
            fotoTim: `default_foto.png`,
            grup: grupId,
            role: 'peserta',
            tahapAktif: 'penyisihan'
        });
    }

    await prisma.tim.createMany({
        data: teamsData,
        skipDuplicates: true,
    });

    console.log('✅ 24 Tim berhasil didaftarkan ke Database.');
    console.log('📊 Distribusi: 12 Tim per Grup (Grup 1 dan Grup 2).');
}

main()
    .catch((e) => {
        console.error('❌ Terjadi kesalahan saat seeding Tim:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });