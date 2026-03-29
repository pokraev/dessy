import { buildEnrichmentSystemPrompt } from '@/lib/ai/prompts/image-prompt';
import type { FrameContext } from '@/types/promptCrafter';

const mockFrameContext: FrameContext = {
  frameId: 'frame-1',
  widthPx: 300,
  heightPx: 400,
  left: 10,
  top: 10,
  scaleX: 1,
  scaleY: 1,
  aspectRatio: '3:4',
  positionHint: 'top-left',
  brandColors: ['#ff0000', '#00ff00'],
  frameName: 'Hero Image',
};

describe('buildEnrichmentSystemPrompt', () => {
  it('includes frame aspectRatio in output', () => {
    const result = buildEnrichmentSystemPrompt(mockFrameContext);
    expect(result).toContain('3:4');
  });

  it('includes frame positionHint in output', () => {
    const result = buildEnrichmentSystemPrompt(mockFrameContext);
    expect(result).toContain('top-left');
  });

  it('includes brand colors in output', () => {
    const result = buildEnrichmentSystemPrompt(mockFrameContext);
    expect(result).toContain('#ff0000');
  });

  it('instructs JSON output with editorial, lifestyle, bold keys', () => {
    const result = buildEnrichmentSystemPrompt(mockFrameContext);
    expect(result).toContain('editorial');
    expect(result).toContain('lifestyle');
    expect(result).toContain('bold');
  });
});
