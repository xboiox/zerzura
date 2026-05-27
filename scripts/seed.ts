import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  aboutContentTable,
  clientLogoTable,
  companyProfileTable,
  jobTable,
  portfolioContentTable,
  servicesContentTable,
} from '../src/models/Schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const SEED_CLERK_ID = 'system_seed';

const futureDate = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
};

const pastDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
};

async function seed() {
  // Company profile
  await db
    .insert(companyProfileTable)
    .values({
      id: 1,
      name: 'PT. Nuren Indah Perkasa',
      description:
        'Perusahaan Nasional yang bergerak dibidang alih daya pekerja maupun pekerjaan yang bersifat kegiatan pendukung. Kami berkomitmen menyediakan solusi SDM terintegrasi sesuai visi dan misi perusahaan Anda.',
      address:
        'Jl. TB. Simatupang Kav. 22, Talavera Office Park Lt. 28, Cilandak, Jakarta Selatan, DKI Jakarta 12430',
      email: 'recruitment@ptnip.com',
      phone: '+62 21 2788 8820',
      linkedinUrl: 'https://www.linkedin.com/company/pt-nuren-indah-perkasa',
      whatsappNumber: '6281234567890',
      instagramUrl: 'https://www.instagram.com/ptnip',
    })
    .onConflictDoNothing();

  console.log('✓ Company profile');

  // About content
  await db
    .insert(aboutContentTable)
    .values({
      id: 1,
      vision:
        'Menjadi perusahaan alih daya terpercaya yang menghadirkan solusi SDM inovatif dan berkontribusi pada pertumbuhan bisnis klien di seluruh Indonesia.',
      mission:
        'Menyediakan solusi alih daya pekerja yang terintegrasi, profesional, dan berintegritas tinggi, sesuai dengan visi dan misi setiap perusahaan klien.',
      integrityTitle: 'Profesional & Berintegritas',
      integrityDesc:
        'Kami mengutamakan profesionalisme dan integritas tinggi dalam setiap proses rekrutmen dan penempatan tenaga kerja.',
      excellenceTitle: 'Pendekatan Komprehensif',
      excellenceDesc:
        'Pendekatan yang komprehensif dan personal untuk memastikan kecocokan optimal antara talenta dan perusahaan.',
      collaborationTitle: 'Temukan Talenta Terbaik',
      collaborationDesc:
        'Membantu perusahaan menemukan dan mempertahankan talenta terbaik yang sesuai dengan kebutuhan bisnis.',
      office1Name: 'Head Office — Jakarta',
      office1Address:
        'Jl. TB. Simatupang Kav. 22, Talavera Office Park Lt. 28, Cilandak, Jakarta Selatan, DKI Jakarta 12430',
      office1MapUrl:
        'https://maps.google.com/maps?q=Talavera+Office+Park+Cilandak+Jakarta+Selatan&output=embed&z=16',
      office2Name: 'Operational Office — Jakarta',
      office2Address:
        'Forise Living Gallery Lt. 1, Jl. Benda Raya No.9, Cilandak Tim., Ps. Minggu, Kota Jakarta Selatan, DKI Jakarta 12560',
      office2MapUrl:
        'https://maps.google.com/maps?q=Forise+Living+Gallery+Benda+Raya+Jakarta+Selatan&output=embed&z=16',
      office3Name: 'Bali Office',
      office3Address:
        'Jl. Tegal Cupek Gg. Wayang No. 24, Kerobokan, Kuta Utara, Badung, Bali 80361',
      office3MapUrl:
        'https://maps.google.com/maps?q=Kerobokan+Kuta+Utara+Badung+Bali&output=embed&z=15',
      mapEmbedUrl:
        'https://maps.google.com/maps?q=Talavera+Office+Park+Cilandak+Jakarta+Selatan&output=embed&z=16',
    })
    .onConflictDoNothing();

  console.log('✓ About content');

  // Services content
  await db
    .insert(servicesContentTable)
    .values({
      id: 1,
      heroSubtitle:
        'Solusi SDM terintegrasi untuk memenuhi kebutuhan tenaga kerja perusahaan Anda.',
      card1Title: 'Outsourcing',
      card1Desc:
        'Inovatif dalam menemukan kandidat terbaik untuk posisi terbuka Anda. Kami mengelola seluruh proses rekrutmen dan penempatan tenaga kerja alih daya.',
      card2Title: 'Executive Search',
      card2Desc:
        'Membantu dalam pencarian executive talent sesuai kebutuhan perusahaan. Kami menemukan pemimpin yang tepat untuk mendorong pertumbuhan bisnis Anda.',
      card3Title: 'HR Consulting',
      card3Desc:
        'Memberikan saran dan dukungan pada semua aspek SDM, mulai dari strategi rekrutmen hingga pengembangan kebijakan ketenagakerjaan.',
      card4Title: 'Tenaga Kerja Harian Lepas',
      card4Desc:
        'Menyediakan tenaga kerja harian lepas yang fleksibel untuk mendukung operasional perusahaan Anda sesuai kebutuhan.',
      ctaTitle: 'Siap Temukan Talent Terbaik?',
      ctaSubtitle: 'Hubungi kami dan mulai perjalanan rekrutmen yang lebih efisien bersama NIP.',
    })
    .onConflictDoNothing();

  console.log('✓ Services content');

  // Portfolio content
  await db
    .insert(portfolioContentTable)
    .values({
      id: 1,
      heroSubtitle:
        'Rekam jejak nyata dalam menghubungkan talenta terbaik dengan perusahaan terkemuka lintas industri.',
      stat1Value: '500+',
      stat1Label: 'Penempatan Berhasil',
      stat2Value: '80+',
      stat2Label: 'Perusahaan Mitra',
      stat3Value: '5+',
      stat3Label: 'Tahun Pengalaman',
      highlight1Title: 'Rekrutmen Lintas Industri',
      highlight1Desc:
        'Berpengalaman dalam rekrutmen di berbagai industri: manufaktur, ritel, teknologi, keuangan, dan perhotelan.',
      highlight2Title: 'Kepuasan Klien Tinggi',
      highlight2Desc:
        'Lebih dari 90% klien menyatakan puas dengan kandidat yang kami tempatkan dan merekomendasikan layanan kami.',
      highlight3Title: 'Proses Cepat & Efisien',
      highlight3Desc:
        'Rata-rata waktu penempatan hanya 30 hari dari brief hingga kandidat mulai bekerja di perusahaan Anda.',
    })
    .onConflictDoNothing();

  console.log('✓ Portfolio content');

  // Client logos
  const clientLogos = [
    {
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Indomaret_logo.svg/320px-Indomaret_logo.svg.png',
      altText: 'Indomaret',
    },
    {
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Alfamart_logo.svg/320px-Alfamart_logo.svg.png',
      altText: 'Alfamart',
    },
    {
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Astra_International_Logo.svg/320px-Astra_International_Logo.svg.png',
      altText: 'Astra International',
    },
    {
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Telkom_Indonesia_2013.svg/320px-Telkom_Indonesia_2013.svg.png',
      altText: 'Telkom Indonesia',
    },
    {
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Bank_Mandiri_logo_2008.svg/320px-Bank_Mandiri_logo_2008.svg.png',
      altText: 'Bank Mandiri',
    },
    {
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/BCA_logo.svg/320px-BCA_logo.svg.png',
      altText: 'BCA',
    },
    {
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Unilever_logo.svg/320px-Unilever_logo.svg.png',
      altText: 'Unilever',
    },
    {
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Pertamina_logo.svg/320px-Pertamina_logo.svg.png',
      altText: 'Pertamina',
    },
    {
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/JNE_Logo.svg/320px-JNE_Logo.svg.png',
      altText: 'JNE',
    },
    {
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Grab_logotype.svg/320px-Grab_logotype.svg.png',
      altText: 'Grab',
    },
  ];

  for (const logo of clientLogos) {
    await db.insert(clientLogoTable).values(logo);
  }

  console.log(`✓ ${clientLogos.length} client logos`);

  // Sample jobs — PUBLISHED with future deadline
  const publishedJobs = [
    {
      title: 'Staff Administrasi',
      description:
        'PT. Nuren Indah Perkasa membuka kesempatan bagi kandidat yang terampil dan profesional untuk bergabung sebagai Staff Administrasi pada salah satu perusahaan klien kami di Jakarta.\n\nAnda akan bertanggung jawab dalam pengelolaan dokumen, pengarsipan data, dan koordinasi kebutuhan administrasi harian kantor.',
      requirements:
        '- Pendidikan minimal D3/S1 semua jurusan\n- Pengalaman minimal 1 tahun di posisi administrasi\n- Menguasai Microsoft Office (Word, Excel, PowerPoint)\n- Teliti, rapi, dan memiliki kemampuan organisasi yang baik\n- Komunikatif dan mampu bekerja dalam tim',
      jobType: 'ONSITE' as const,
      location: 'Jakarta Selatan',
      salaryMin: 4_500_000,
      salaryMax: 6_000_000,
      deadline: futureDate(30),
    },
    {
      title: 'Customer Service Representative',
      description:
        'Kami mencari kandidat yang ramah dan komunikatif untuk mengisi posisi Customer Service pada perusahaan ritel klien kami. Posisi ini merupakan penempatan alih daya (outsourcing).\n\nAnda akan menjadi garda terdepan dalam melayani pelanggan dan menyelesaikan keluhan dengan profesional.',
      requirements:
        '- Pendidikan minimal SMA/SMK atau D3\n- Berpenampilan menarik dan komunikatif\n- Pengalaman di bidang customer service merupakan nilai plus\n- Sabar, ramah, dan mampu menangani keluhan pelanggan\n- Bersedia bekerja dengan sistem shift',
      jobType: 'ONSITE' as const,
      location: 'Jakarta Barat',
      salaryMin: 4_000_000,
      salaryMax: 5_500_000,
      deadline: futureDate(21),
    },
    {
      title: 'Sales Promotor',
      description:
        'Bergabunglah sebagai Sales Promotor untuk memperkenalkan dan mempromosikan produk klien kami di berbagai gerai ritel. Posisi ini merupakan penempatan tenaga kerja harian lepas.\n\nAnda akan bertugas meningkatkan penjualan dan memberikan informasi produk kepada calon pembeli.',
      requirements:
        '- Pendidikan minimal SMA/SMK\n- Energik, percaya diri, dan berorientasi target\n- Pengalaman di bidang sales atau promosi merupakan nilai plus\n- Bersedia ditempatkan di area Jabodetabek\n- Mampu bekerja mandiri maupun dalam tim',
      jobType: 'ONSITE' as const,
      location: 'Jabodetabek',
      salaryMin: 3_500_000,
      salaryMax: 5_000_000,
      deadline: futureDate(14),
    },
    {
      title: 'Operator Produksi',
      description:
        'Kami membuka posisi Operator Produksi untuk ditempatkan di perusahaan manufaktur klien kami. Posisi ini merupakan penempatan outsourcing jangka panjang dengan benefit lengkap.\n\nAnda akan bertanggung jawab menjalankan mesin produksi dan memastikan standar kualitas terpenuhi.',
      requirements:
        '- Pendidikan minimal SMA/SMK teknik atau sederajat\n- Pengalaman di pabrik/industri merupakan nilai plus\n- Bersedia bekerja shift (pagi/siang/malam)\n- Disiplin, teliti, dan mampu bekerja di lingkungan industri\n- Domisili atau bersedia ditempatkan di Tangerang',
      jobType: 'ONSITE' as const,
      location: 'Tangerang',
      salaryMin: 4_200_000,
      salaryMax: 5_500_000,
      deadline: futureDate(45),
    },
    {
      title: 'General Affairs Staff',
      description:
        'Posisi General Affairs Staff dibutuhkan untuk mengelola kebutuhan operasional dan fasilitas kantor klien kami. Penempatan dilakukan melalui skema outsourcing.\n\nAnda akan menangani pengadaan kebutuhan kantor, pemeliharaan fasilitas, dan koordinasi vendor.',
      requirements:
        '- Pendidikan minimal D3/S1\n- Pengalaman minimal 1 tahun di posisi GA atau umum\n- Menguasai pengadaan barang dan vendor management\n- Memiliki kendaraan pribadi (diutamakan)\n- Proaktif dan mampu mengelola prioritas pekerjaan',
      jobType: 'ONSITE' as const,
      location: 'Jakarta Selatan',
      salaryMin: 5_000_000,
      salaryMax: 7_000_000,
      deadline: futureDate(60),
    },
    {
      title: 'Accounting Staff',
      description:
        'PT. Nuren Indah Perkasa membuka rekrutmen untuk posisi Accounting Staff yang akan ditempatkan di perusahaan distribusi klien kami di Jakarta.\n\nAnda akan bertanggung jawab dalam pencatatan transaksi keuangan, rekonsiliasi akun, dan penyusunan laporan keuangan bulanan.',
      requirements:
        '- Pendidikan S1 Akuntansi atau Keuangan\n- Pengalaman minimal 1–2 tahun di bidang akuntansi\n- Menguasai software akuntansi (SAP, accurate, atau sejenisnya)\n- Paham pajak dasar (PPh 21, PPN)\n- Teliti, analitis, dan mampu bekerja dengan deadline',
      jobType: 'ONSITE' as const,
      location: 'Jakarta Utara',
      salaryMin: 5_500_000,
      salaryMax: 8_000_000,
      deadline: futureDate(35),
    },
  ];

  for (const job of publishedJobs) {
    await db.insert(jobTable).values({
      ...job,
      status: 'PUBLISHED',
      createdByClerkId: SEED_CLERK_ID,
    });
  }

  console.log(`✓ ${publishedJobs.length} published jobs`);

  // One expired job — to test "Berakhir" badge
  await db.insert(jobTable).values({
    title: 'Resepsionis — Ditutup',
    description: 'Posisi ini sudah tidak menerima lamaran baru.',
    requirements:
      '- Pendidikan minimal D3\n- Berpenampilan menarik dan komunikatif\n- Pengalaman sebagai resepsionis atau front desk merupakan nilai plus',
    jobType: 'ONSITE',
    location: 'Jakarta Selatan',
    salaryMin: 4_000_000,
    salaryMax: 5_000_000,
    deadline: pastDate(5),
    status: 'PUBLISHED',
    createdByClerkId: SEED_CLERK_ID,
  });

  console.log('✓ 1 expired job (untuk testing badge)');

  // One draft job — should NOT appear publicly
  await db.insert(jobTable).values({
    title: '[DRAFT] Driver Operasional',
    description: 'Draft ini tidak akan muncul di halaman publik.',
    requirements: '- SIM A/B\n- Pengalaman mengemudi minimal 2 tahun',
    jobType: 'ONSITE',
    location: 'Jakarta',
    deadline: futureDate(30),
    status: 'DRAFT',
    createdByClerkId: SEED_CLERK_ID,
  });

  console.log('✓ 1 draft job (seharusnya tidak muncul di publik)');
  console.log('\nSeed selesai!');

  await pool.end();
}

try {
  await seed();
} catch (error: unknown) {
  console.error(error);
  await pool.end();
  process.exit(1);
}
