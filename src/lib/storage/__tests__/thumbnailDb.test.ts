import { describe, it, expect } from '@jest/globals';

describe('thumbnailDb', () => {
  it.todo('saveThumbnail stores a blob in IndexedDB');
  it.todo('getThumbnail retrieves a blob URL for existing key');
  it.todo('getThumbnail returns null for missing key');
  it.todo('deleteThumbnail removes the entry');

  it('stub passes', () => {
    expect(true).toBe(true);
  });
});
