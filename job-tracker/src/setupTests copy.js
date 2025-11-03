import '@testing-library/jest-dom';
jest.mock('./lib/firebase.js', () => ({ db: {} }));  // global mock (optional but nice)
