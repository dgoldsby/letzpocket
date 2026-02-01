// Mock Firebase for testing
const mockAuth = {
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  currentUser: null
};

const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    })),
    add: jest.fn(),
    where: jest.fn(),
    get: jest.fn()
  }))
};

const mockStorage = {
  ref: jest.fn(() => ({
    put: jest.fn(),
    getDownloadURL: jest.fn()
  }))
};

const mockApp = {
  auth: jest.fn(() => mockAuth),
  firestore: jest.fn(() => mockFirestore),
  storage: jest.fn(() => mockStorage)
};

module.exports = {
  initializeApp: jest.fn(() => mockApp),
  auth: () => mockAuth,
  firestore: () => mockFirestore,
  storage: () => mockStorage,
  mockAuth,
  mockFirestore,
  mockStorage
};
