import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting E2E test data seeding...');

  // Clear existing data
  await prisma.$transaction([
    prisma.userProgress.deleteMany(),
    prisma.learningMaterial.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.course.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create test users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.example.com',
      username: 'admin',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      firstName: 'Test',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@test.example.com',
      username: 'user1',
      passwordHash: await bcrypt.hash('User123!', 10),
      firstName: 'Test',
      lastName: 'User 1',
      role: 'USER',
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@test.example.com',
      username: 'user2',
      passwordHash: await bcrypt.hash('User123!', 10),
      firstName: 'Test',
      lastName: 'User 2',
      role: 'USER',
      isActive: true,
    },
  });

  // Create test courses
  const typescriptCourse = await prisma.course.create({
    data: {
      title: 'Introduction to TypeScript',
      description: 'Learn TypeScript basics and advanced features',
      category: 'Programming',
      createdBy: adminUser.id,
      difficultyLevel: 'BEGINNER',
      isPublished: true,
      estimatedHours: 8,
      lessons: {
        create: [
          {
            title: 'Getting Started with TypeScript',
            description: 'Introduction to TypeScript and setup',
            sortOrder: 1,
            estimatedMinutes: 30,
            isPublished: true,
          },
          {
            title: 'TypeScript Types',
            description: 'Understanding TypeScript type system',
            sortOrder: 2,
            estimatedMinutes: 45,
            isPublished: true,
          },
          {
            title: 'Interfaces and Classes',
            description: 'Working with interfaces and classes',
            sortOrder: 3,
            estimatedMinutes: 60,
            isPublished: true,
          },
        ],
      },
    },
  });

  const reactCourse = await prisma.course.create({
    data: {
      title: 'Advanced React Patterns',
      description: 'Master advanced React patterns and best practices',
      category: 'Web Development',
      createdBy: adminUser.id,
      difficultyLevel: 'ADVANCED',
      isPublished: true,
      estimatedHours: 6,
      lessons: {
        create: [
          {
            title: 'Compound Components',
            description: 'Building flexible compound components',
            sortOrder: 1,
            estimatedMinutes: 40,
            isPublished: true,
          },
          {
            title: 'Render Props Pattern',
            description: 'Understanding render props',
            sortOrder: 2,
            estimatedMinutes: 35,
            isPublished: true,
          },
        ],
      },
    },
  });

  // Get lessons to add materials
  const lessons = await prisma.lesson.findMany({
    where: {
      courseId: {
        in: [typescriptCourse.id, reactCourse.id]
      }
    },
    orderBy: [
      { courseId: 'asc' },
      { sortOrder: 'asc' }
    ]
  });

  // Create learning materials for E2E testing
  const materials = [];
  let materialId = 1;

  for (const lesson of lessons) {
    // Main material for each lesson
    materials.push(await prisma.learningMaterial.create({
      data: {
        id: materialId++,
        title: `${lesson.title} - Main Material`,
        description: `Main learning material for ${lesson.title}`,
        materialType: 'URL',
        externalUrl: 'https://example.com/material',
        materialCategory: 'MAIN',
        sortOrder: 1,
        isPublished: true,
        lessonId: lesson.id,
        durationMinutes: 30,
      },
    }));

    // Supplementary material for each lesson
    materials.push(await prisma.learningMaterial.create({
      data: {
        id: materialId++,
        title: `${lesson.title} - Supplementary`,
        description: `Additional practice material for ${lesson.title}`,
        materialType: 'MANUAL_PROGRESS',
        materialCategory: 'SUPPLEMENTARY',
        sortOrder: 2,
        isPublished: true,
        lessonId: lesson.id,
        allowManualProgress: true,
        durationMinutes: 15,
      },
    }));
  }

  // Create enrollment for user1 in Advanced React Patterns course
  await prisma.userProgress.create({
    data: {
      userId: user1.id,
      courseId: reactCourse.id,
      progressRate: 0,
      spentMinutes: 0,
    },
  });
  console.log('✅ E2E test data seeding completed!');
  console.log('📧 Test accounts created:');
  console.log('   Admin: admin@test.example.com / Admin123!');
  console.log('   User1: user1@test.example.com / User123!');
  console.log('   User2: user2@test.example.com / User123!');
  console.log(`📚 Test courses created:`);
  console.log(`   ${typescriptCourse.title} (${typescriptCourse.id}) - ${lessons.filter(l => l.courseId === typescriptCourse.id).length} lessons`);
  console.log(`   ${reactCourse.title} (${reactCourse.id}) - ${lessons.filter(l => l.courseId === reactCourse.id).length} lessons`);
  console.log(`📝 Learning materials created: ${materials.length}`);
  console.log(`👥 Test users: ${user1.email}, ${user2.email}`);
}

main()
  .catch((e) => {
    console.error('❌ E2E seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });