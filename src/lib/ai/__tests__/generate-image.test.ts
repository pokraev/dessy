import { enrichPrompt, callGeminiImage, assemblePrompt, snapAspectRatio, base64ToBlob } from '@/lib/ai/generate-image';
import type { FrameContext, PromptCustomization } from '@/types/promptCrafter';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockFrameContext: FrameContext = {
  frameId: 'frame-1',
  widthPx: 300,
  heightPx: 400,
  left: 10,
  top: 10,
  scaleX: 1,
  scaleY: 1,
  aspectRatio: '3:4',
  positionHint: 'center',
  brandColors: ['#ff0000', '#00ff00'],
  frameName: 'Main Image',
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('enrichPrompt', () => {
  it('returns { editorial, lifestyle, bold } from parsed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: '{"editorial":"e","lifestyle":"l","bold":"b"}' }],
          },
        }],
      }),
    });

    const result = await enrichPrompt('test-api-key', 'a dog playing in a park', mockFrameContext);

    expect(result).toEqual({ editorial: 'e', lifestyle: 'l', bold: 'b' });
  });

  it('calls Gemini with gemini-2.5-flash URL and responseMimeType application/json', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: '{"editorial":"e","lifestyle":"l","bold":"b"}' }],
          },
        }],
      }),
    });

    await enrichPrompt('my-key', 'test description', mockFrameContext);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('gemini-2.5-flash');
    const body = JSON.parse(options.body);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
  });

  it('throws on JSON parse failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: 'not valid json' }],
          },
        }],
      }),
    });

    await expect(enrichPrompt('key', 'desc', mockFrameContext)).rejects.toThrow();
  });
});

describe('callGeminiImage', () => {
  it('returns data URL from inline_data response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ inline_data: { mime_type: 'image/png', data: 'abc123' } }],
          },
        }],
      }),
    });

    const result = await callGeminiImage('test-key', 'a photo of a cat', '1:1');

    expect(result).toBe('data:image/png;base64,abc123');
  });

  it('calls the gemini-2.5-flash-image model URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ inline_data: { mime_type: 'image/png', data: 'xyz' } }],
          },
        }],
      }),
    });

    await callGeminiImage('test-key', 'prompt', '1:1');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('gemini-2.5-flash-image');
  });

  it('throws with 403 message on 403 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'billing required',
    });

    await expect(callGeminiImage('bad-key', 'prompt', '1:1')).rejects.toThrow('access denied');
  });

  it('throws on missing inline_data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: 'some text' }],
          },
        }],
      }),
    });

    await expect(callGeminiImage('key', 'prompt', '1:1')).rejects.toThrow('No image in response');
  });
});

describe('assemblePrompt', () => {
  it('joins base with all non-empty knobs', () => {
    const customization: PromptCustomization = {
      mood: 'warm',
      lighting: 'natural daylight',
      composition: 'wide shot',
      style: 'photorealistic',
      background: 'white',
    };
    const result = assemblePrompt('base text', customization);
    expect(result).toBe('base text, warm mood, natural daylight lighting, wide shot, photorealistic style, white background');
  });

  it('returns only base text when all knobs are empty', () => {
    const customization: PromptCustomization = {
      mood: '',
      lighting: '',
      composition: '',
      style: '',
      background: '',
    };
    const result = assemblePrompt('base text', customization);
    expect(result).toBe('base text');
  });

  it('handles partial knobs', () => {
    const customization: PromptCustomization = {
      mood: 'warm',
      lighting: '',
      composition: '',
      style: 'photorealistic',
      background: '',
    };
    const result = assemblePrompt('base text', customization);
    expect(result).toBe('base text, warm mood, photorealistic style');
  });
});

describe('snapAspectRatio', () => {
  it('maps 300x400 to 3:4', () => {
    expect(snapAspectRatio(300, 400)).toBe('3:4');
  });

  it('maps 400x300 to 4:3', () => {
    expect(snapAspectRatio(400, 300)).toBe('4:3');
  });

  it('maps 500x500 to 1:1', () => {
    expect(snapAspectRatio(500, 500)).toBe('1:1');
  });

  it('maps 900x1600 to 9:16', () => {
    expect(snapAspectRatio(900, 1600)).toBe('9:16');
  });

  it('maps 1600x900 to 16:9', () => {
    expect(snapAspectRatio(1600, 900)).toBe('16:9');
  });

  it('maps 1000x100 to 16:9 (extreme wide)', () => {
    expect(snapAspectRatio(1000, 100)).toBe('16:9');
  });

  it('maps 320x400 to 3:4 (close enough)', () => {
    expect(snapAspectRatio(320, 400)).toBe('3:4');
  });
});

describe('base64ToBlob', () => {
  it('converts data:image/png;base64,... to a Blob with type image/png', () => {
    // Minimal valid base64 PNG header
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = base64ToBlob(dataUrl);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });
});
