import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting E2E test data seeding...');

  // Clear existing data
  await prisma.$transaction([
    prisma.userProgress.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.courseEnrollment.deleteMany(),
    prisma.course.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create categories
  const programmingCategory = await prisma.category.create({
    data: {
      name: 'Programming',
      description: 'Programming languages and concepts',
    },
  });

  const webDevCategory = await prisma.category.create({
    data: {
      name: 'Web Development',
      description: 'Web development technologies',
    },
  });

  // Create test users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.example.com',
      username: 'admin',
      password: await bcrypt.hash('Admin123!', 10),
      fullName: 'Test Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@test.example.com',
      username: 'user1',
      password: await bcrypt.hash('User123!', 10),
      fullName: 'Test User 1',
      role: 'USER',
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@test.example.com',
      username: 'user2',
      password: await bcrypt.hash('User123!', 10),
      fullName: 'Test User 2',
      role: 'USER',
      isActive: true,
    },
  });

  // Create test courses
  const typescriptCourse = await prisma.course.create({
    data: {
      title: 'Introduction to TypeScript',
      description: 'Learn TypeScript basics and advanced features',
      categoryId: programmingCategory.id,
      instructorId: adminUser.id,
      level: 'BEGINNER',
      isPublished: true,
      price: 0,
      lessons: {
        create: [
          {
            title: 'Getting Started with TypeScript',
            description: 'Introduction to TypeScript and setup',
            orderIndex: 1,
            duration: 30,
          },
          {
            title: 'TypeScript Types',
            description: 'Understanding TypeScript type system',
            orderIndex: 2,
            duration: 45,
          },
          {
            title: 'Interfaces and Classes',
            description: 'Working with interfaces and classes',
            orderIndex: 3,
            duration: 60,
          },
        ],
      },
    },
  });

  const reactCourse = await prisma.course.create({
    data: {
      title: 'Advanced React Patterns',
      description: 'Master advanced React patterns and best practices',
      categoryId: webDevCategory.id,
      instructorId: adminUser.id,
      level: 'ADVANCED',
      isPublished: true,
      price: 49.99,
      lessons: {
        create: [
          {
            title: 'Compound Components',
            description: 'Building flexible compound components',
            orderIndex: 1,
            duration: 40,
          },
          {
            title: 'Render Props Pattern',
            description: 'Understanding render props',
            orderIndex: 2,
            duration: 35,
          },
        ],
      },
    },
  });

  const nodeCourse = await prisma.course.create({
    data: {
      title: 'Node.js Backend Development',
      description: 'Build scalable backend applications with Node.js',
      categoryId: webDevCategory.id,
      instructorId: adminUser.id,
      level: 'INTERMEDIATE',
      isPublished: false,
      price: 39.99,
    },
  });

  // Create enrollments
  await prisma.courseEnrollment.create({
    data: {
      userId: user1.id,
      courseId: typescriptCourse.id,
      enrolledAt: new Date(),
    },
  });

  await prisma.courseEnrollment.create({
    data: {
      userId: user1.id,
      courseId: reactCourse.id,
      enrolledAt: new Date(),
    },
  });

  await prisma.courseEnrollment.create({
    data: {
      userId: user2.id,
      courseId: typescriptCourse.id,
      enrolledAt: new Date(),
    },
  });

  console.log('✅ E2E test data seeding completed!');
  console.log('📧 Test accounts created:');
  console.log('   Admin: admin@test.example.com / Admin123!');
  console.log('   User1: user1@test.example.com / User123!');
  console.log('   User2: user2@test.example.com / User123!');
}

main()
  .catch((e) => {
    console.error('❌ E2E seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });