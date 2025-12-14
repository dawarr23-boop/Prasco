import { Sequelize } from 'sequelize';

export const setupTestDatabase = async (): Promise<Sequelize> => {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'bulletin_board_test',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    logging: false,
  });

  await sequelize.authenticate();
  await sequelize.sync({ force: true }); // Reset database

  return sequelize;
};

export const teardownTestDatabase = async (sequelize: Sequelize): Promise<void> => {
  await sequelize.drop();
  await sequelize.close();
};
