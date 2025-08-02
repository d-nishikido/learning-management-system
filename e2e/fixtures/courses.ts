export interface TestCourse {
  id?: number;
  title: string;
  description: string;
  categoryId: number;
  instructorId: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  isPublished: boolean;
  price?: number;
}

export const testCourses: TestCourse[] = [
  {
    title: 'Introduction to TypeScript',
    description: 'Learn TypeScript basics and advanced features',
    categoryId: 1,
    instructorId: 1,
    level: 'BEGINNER',
    isPublished: true,
    price: 0
  },
  {
    title: 'Advanced React Patterns',
    description: 'Master advanced React patterns and best practices',
    categoryId: 1,
    instructorId: 1,
    level: 'ADVANCED',
    isPublished: true,
    price: 49.99
  },
  {
    title: 'Node.js Backend Development',
    description: 'Build scalable backend applications with Node.js',
    categoryId: 2,
    instructorId: 1,
    level: 'INTERMEDIATE',
    isPublished: false,
    price: 39.99
  }
];