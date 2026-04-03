import '@testing-library/jest-dom'

// Mock IndexedDB for Dexie
import 'fake-indexeddb/auto'

// Mock crypto.randomUUID
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    },
  })
}
