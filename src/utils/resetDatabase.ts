import { seedDatabase } from './seedData';

// Function to reset and reseed the database
export const resetDatabase = async () => {
  try {
    console.log('Resetting database...');
    await seedDatabase();
    console.log('Database reset complete!');
    window.location.reload();
  } catch (error) {
    console.error('Error resetting database:', error);
  }
};

// Make it available globally for console access
(window as any).resetDatabase = resetDatabase;