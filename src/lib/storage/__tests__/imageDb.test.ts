// Mock idb before importing imageDb
const mockPut = jest.fn();
const mockGet = jest.fn();
const mockDelete = jest.fn();
const mockDb = { put: mockPut, get: mockGet, delete: mockDelete };

jest.mock('idb', () => ({
  openDB: jest.fn().mockResolvedValue(mockDb),
}));

// Mock crypto.randomUUID
const MOCK_UUID = 'test-uuid-1234-5678-abcd-ef0123456789';
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => MOCK_UUID },
  configurable: true,
});

// Mock URL.createObjectURL
const MOCK_BLOB_URL = 'blob:http://localhost/mock-uuid';
Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => MOCK_BLOB_URL),
  configurable: true,
  writable: true,
});

import { storeImage, getImage, deleteImage } from '../imageDb';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('storeImage', () => {
  it('returns a UUID string', async () => {
    mockPut.mockResolvedValue(undefined);
    const blob = new Blob(['image data'], { type: 'image/png' });
    const id = await storeImage(blob);
    expect(typeof id).toBe('string');
    expect(id).toBe(MOCK_UUID);
    expect(mockPut).toHaveBeenCalledWith('images', blob, MOCK_UUID);
  });
});

describe('getImage', () => {
  it('returns a blob URL string for a valid id', async () => {
    const blob = new Blob(['image data'], { type: 'image/png' });
    mockGet.mockResolvedValue(blob);
    const url = await getImage('some-id');
    expect(typeof url).toBe('string');
    expect(url).toBe(MOCK_BLOB_URL);
  });

  it('returns null for unknown id', async () => {
    mockGet.mockResolvedValue(undefined);
    const url = await getImage('unknown-id');
    expect(url).toBeNull();
  });
});

describe('deleteImage', () => {
  it('calls db.delete with the id', async () => {
    mockDelete.mockResolvedValue(undefined);
    await deleteImage('some-id');
    expect(mockDelete).toHaveBeenCalledWith('images', 'some-id');
  });
});
