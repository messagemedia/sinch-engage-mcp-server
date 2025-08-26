module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json'],
  roots: ['<rootDir>/tests'],
  transformIgnorePatterns: ['/node_modules/'],
};