import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.example.com' },
    update: {},
    create: {
      email: 'admin@test.example.com',
      username: 'admin',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      firstName: 'Test',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Create test users
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@test.example.com' },
    update: {},
    create: {
      email: 'user1@test.example.com',
      username: 'user1',
      passwordHash: await bcrypt.hash('User123!', 10),
      firstName: 'Test',
      lastName: 'User 1',
      role: 'USER',
      isActive: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@test.example.com' },
    update: {},
    create: {
      email: 'user2@test.example.com',
      username: 'user2',
      passwordHash: await bcrypt.hash('User123!', 10),
      firstName: 'Test',
      lastName: 'User 2',
      role: 'USER',
      isActive: true,
    },
  });

  // Create TypeScript course with lessons and materials
  const typescriptCourse = await prisma.course.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: 'Introduction to TypeScript',
      description: 'Learn TypeScript basics and advanced features',
      category: 'Programming',
      createdBy: adminUser.id,
      difficultyLevel: 'BEGINNER',
      isPublished: true,
      estimatedHours: 8,
    },
  });

  // Create lessons for TypeScript course
  const lesson1 = await prisma.lesson.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: 'Getting Started with TypeScript',
      description: 'Introduction to TypeScript and setup',
      content: '<h2>Getting Started</h2><p>TypeScript is a programming language developed by Microsoft that builds on JavaScript by adding static type definitions.</p>',
      sortOrder: 1,
      estimatedMinutes: 30,
      isPublished: true,
      courseId: typescriptCourse.id,
    },
  });

  const lesson2 = await prisma.lesson.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      title: 'TypeScript Types',
      description: 'Understanding TypeScript type system',
      content: '<h2>Type System</h2><p>TypeScript provides several basic types and advanced type features.</p>',
      sortOrder: 2,
      estimatedMinutes: 45,
      isPublished: true,
      courseId: typescriptCourse.id,
    },
  });

  const lesson3 = await prisma.lesson.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      title: 'Interfaces and Classes',
      description: 'Working with interfaces and classes',
      content: '<h2>Interfaces and Classes</h2><p>Learn how to use interfaces and classes in TypeScript.</p>',
      sortOrder: 3,
      estimatedMinutes: 60,
      isPublished: true,
      courseId: typescriptCourse.id,
    },
  });

  // Create React course with lessons and materials
  const reactCourse = await prisma.course.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      title: 'Advanced React Patterns',
      description: 'Master advanced React patterns and best practices',
      category: 'Web Development',
      createdBy: adminUser.id,
      difficultyLevel: 'ADVANCED',
      isPublished: true,
      estimatedHours: 6,
    },
  });

  const lesson4 = await prisma.lesson.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      title: 'Compound Components',
      description: 'Building flexible compound components',
      content: '<h2>Compound Components</h2><p>Learn how to build flexible compound components in React.</p>',
      sortOrder: 1,
      estimatedMinutes: 40,
      isPublished: true,
      courseId: reactCourse.id,
    },
  });

  const lesson5 = await prisma.lesson.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      title: 'Render Props Pattern',
      description: 'Understanding render props',
      content: '<h2>Render Props</h2><p>Master the render props pattern for component composition.</p>',
      sortOrder: 2,
      estimatedMinutes: 35,
      isPublished: true,
      courseId: reactCourse.id,
    },
  });

  // Create learning materials for lessons
  await prisma.learningMaterial.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: 'TypeScript Official Documentation',
      description: 'Comprehensive guide to TypeScript from the official documentation',
      materialType: 'URL',
      externalUrl: 'https://www.typescriptlang.org/docs/',
      materialCategory: 'MAIN',
      sortOrder: 1,
      isPublished: true,
      lessonId: lesson1.id,
      durationMinutes: 30,
    },
  });

  await prisma.learningMaterial.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      title: 'TypeScript Playground',
      description: 'Interactive TypeScript playground for hands-on practice',
      materialType: 'URL',
      externalUrl: 'https://www.typescriptlang.org/play',
      materialCategory: 'SUPPLEMENTARY',
      sortOrder: 2,
      isPublished: true,
      lessonId: lesson1.id,
      durationMinutes: 15,
    },
  });

  await prisma.learningMaterial.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      title: 'Basic Types Tutorial',
      description: 'Learn about TypeScript basic types with examples',
      materialType: 'URL',
      externalUrl: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html',
      materialCategory: 'MAIN',
      sortOrder: 1,
      isPublished: true,
      lessonId: lesson2.id,
      durationMinutes: 25,
    },
  });

  await prisma.learningMaterial.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      title: 'TypeScript Type System Deep Dive',
      description: 'External reading material on TypeScript type system',
      materialType: 'MANUAL_PROGRESS',
      materialCategory: 'SUPPLEMENTARY',
      sortOrder: 2,
      isPublished: true,
      lessonId: lesson2.id,
      allowManualProgress: true,
      durationMinutes: 60,
    },
  });

  await prisma.learningMaterial.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      title: 'Interfaces in TypeScript',
      description: 'Learn how to define and use interfaces',
      materialType: 'URL',
      externalUrl: 'https://www.typescriptlang.org/docs/handbook/2/objects.html',
      materialCategory: 'MAIN',
      sortOrder: 1,
      isPublished: true,
      lessonId: lesson3.id,
      durationMinutes: 30,
    },
  });

  await prisma.learningMaterial.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      title: 'Classes in TypeScript',
      description: 'Understanding TypeScript classes and inheritance',
      materialType: 'URL',
      externalUrl: 'https://www.typescriptlang.org/docs/handbook/2/classes.html',
      materialCategory: 'MAIN',
      sortOrder: 2,
      isPublished: true,
      lessonId: lesson3.id,
      durationMinutes: 30,
    },
  });

  // React course materials
  await prisma.learningMaterial.upsert({
    where: { id: 7 },
    update: {},
    create: {
      id: 7,
      title: 'Compound Components Pattern',
      description: 'Learn about the compound components pattern in React',
      materialType: 'URL',
      externalUrl: 'https://kentcdodds.com/blog/compound-components-with-react-hooks',
      materialCategory: 'MAIN',
      sortOrder: 1,
      isPublished: true,
      lessonId: lesson4.id,
      durationMinutes: 20,
    },
  });

  await prisma.learningMaterial.upsert({
    where: { id: 8 },
    update: {},
    create: {
      id: 8,
      title: 'React Patterns Video Tutorial',
      description: 'External video tutorial on React compound components',
      materialType: 'MANUAL_PROGRESS',
      materialCategory: 'SUPPLEMENTARY',
      sortOrder: 2,
      isPublished: true,
      lessonId: lesson4.id,
      allowManualProgress: true,
      durationMinutes: 45,
    },
  });

  await prisma.learningMaterial.upsert({
    where: { id: 9 },
    update: {},
    create: {
      id: 9,
      title: 'Render Props Pattern Guide',
      description: 'Complete guide to render props pattern',
      materialType: 'URL',
      externalUrl: 'https://reactjs.org/docs/render-props.html',
      materialCategory: 'MAIN',
      sortOrder: 1,
      isPublished: true,
      lessonId: lesson5.id,
      durationMinutes: 25,
    },
  });

  await prisma.learningMaterial.upsert({
    where: { id: 10 },
    update: {},
    create: {
      id: 10,
      title: 'Advanced React Patterns Book',
      description: 'External book reading on advanced React patterns',
      materialType: 'MANUAL_PROGRESS',
      materialCategory: 'SUPPLEMENTARY',
      sortOrder: 2,
      isPublished: true,
      lessonId: lesson5.id,
      allowManualProgress: true,
      durationMinutes: 90,
    },
  });

  console.log('✅ Database seeding completed!');
  console.log('📧 Test accounts created:');
  console.log(`   Admin: ${adminUser.email} / Admin123!`);
  console.log(`   User1: ${user1.email} / User123!`);
  console.log(`   User2: ${user2.email} / User123!`);
  console.log(`📚 Test courses created:`);
  console.log(`   ${typescriptCourse.title} (${typescriptCourse.id}) - 3 lessons, 6 materials`);
  console.log(`   ${reactCourse.title} (${reactCourse.id}) - 2 lessons, 4 materials`);
  console.log(`📝 Total learning materials created: 10`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });