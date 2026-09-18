import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaClient, Role, UserStatus } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { slugify } from '../src/common/utils/slug.util';

const BCRYPT_ROUNDS = 12;

const ADMIN_EMAIL = 'admin@synergi.dev';
const ADMIN_PASSWORD = 'AdminPass123!';

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Roofing',
  'Landscaping',
  'HVAC',
  'General Contracting',
];

const SKILLS = [
  'Pipe Fitting',
  'Wiring',
  'Drywall',
  'Tile Setting',
  'Framing',
  'Concrete Work',
  'Interior Design',
  'Project Management',
];

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      firstName: 'Synergi',
      lastName: 'Admin',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Admin account ready: ${admin.email}`);
}

async function seedCategories() {
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories`);
}

async function seedSkills() {
  for (const name of SKILLS) {
    await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${SKILLS.length} skills`);
}

async function main() {
  await seedAdmin();
  await seedCategories();
  await seedSkills();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
