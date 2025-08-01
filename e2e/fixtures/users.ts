export interface TestUser {
  email: string;
  password: string;
  username: string;
  role: 'ADMIN' | 'USER';
  fullName: string;
}

export const testUsers: Record<string, TestUser> = {
  admin: {
    email: 'admin@test.example.com',
    password: 'Admin123!',
    username: 'admin',
    role: 'ADMIN',
    fullName: 'Test Admin'
  },
  user1: {
    email: 'user1@test.example.com',
    password: 'User123!',
    username: 'user1',
    role: 'USER',
    fullName: 'Test User 1'
  },
  user2: {
    email: 'user2@test.example.com',
    password: 'User123!',
    username: 'user2',
    role: 'USER',
    fullName: 'Test User 2'
  }
};