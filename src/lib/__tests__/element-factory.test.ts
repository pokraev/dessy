/**
 * Element Factory tests — TDD RED phase
 * Tests all 5 element types: text frame, image frame, shape, color block, group
 */

// Mock fabric to avoid browser-only APIs in tests
jest.mock('fabric', () => {
  class MockFabricObj {
    [key: string]: unknown;
    constructor(opts?: Record<string, unknown>) {
      if (opts) Object.assign(this, opts);
    }
  }

  class Rect extends MockFabricObj {}
  class Ellipse extends MockFabricObj {}
  class Triangle extends MockFabricObj {}
  class Line extends MockFabricObj {
    constructor(_points: number[], opts?: Record<string, unknown>) {
      super(opts);
    }
  }
  class Textbox extends MockFabricObj {
    constructor(_text: string, opts?: Record<string, unknown>) {
      super(opts);
    }
  }

  return { Rect, Ellipse, Triangle, Line, Textbox };
});

// Mock crypto.randomUUID for deterministic tests
const mockUUID = 'test-uuid-1234';
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => mockUUID },
  writable: true,
});

import {
  createShape,
  createTextFrame,
  createImageFrame,
  createColorBlock,
  CUSTOM_PROPS,
} from '../fabric/element-factory';

describe('element-factory', () => {
  describe('createShape', () => {
    it('Test 1: createShape(rect) returns object with originX: left and originY: top', () => {
      const rect = createShape('rect', { left: 10, top: 20, width: 100, height: 50 });
      expect(rect.originX).toBe('left');
      expect(rect.originY).toBe('top');
    });

    it('returns rect with correct position and size', () => {
      const rect = createShape('rect', { left: 10, top: 20, width: 100, height: 50 });
      expect(rect.left).toBe(10);
      expect(rect.top).toBe(20);
      expect(rect.width).toBe(100);
      expect(rect.height).toBe(50);
    });

    it('Test 2: createShape(circle) returns Ellipse with correct dimensions', () => {
      const circle = createShape('circle', { left: 0, top: 0, width: 80, height: 80 });
      expect(circle.rx).toBe(40); // width/2
      expect(circle.ry).toBe(40); // height/2
      expect(circle.originX).toBe('left');
      expect(circle.originY).toBe('top');
    });

    it('creates line with shapeKind: line', () => {
      const line = createShape('line', { left: 0, top: 0, width: 100, height: 0 });
      expect((line as Record<string, unknown>).customType).toBe('shape');
      expect((line as Record<string, unknown>).shapeKind).toBe('line');
    });

    it('Test 6: shape has originX: left (not center — Fabric.js 7 default changed)', () => {
      const shape = createShape('rect', { left: 0, top: 0, width: 50, height: 50 });
      expect(shape.originX).toBe('left');
      expect(shape.originY).toBe('top');
    });

    it('Test 7: shape has name property set', () => {
      const rect = createShape('rect', { left: 0, top: 0, width: 50, height: 50 });
      expect((rect as Record<string, unknown>).name).toBeTruthy();
    });

    it('shape has customType, id, locked properties', () => {
      const shape = createShape('rect', { left: 0, top: 0, width: 50, height: 50 });
      expect((shape as Record<string, unknown>).customType).toBe('shape');
      expect((shape as Record<string, unknown>).id).toBe(mockUUID);
      expect((shape as Record<string, unknown>).locked).toBe(false);
    });
  });

  describe('createTextFrame', () => {
    it('Test 3: createTextFrame returns Textbox with customType: text', () => {
      const tb = createTextFrame({ left: 10, top: 10, width: 200, height: 100 });
      expect((tb as Record<string, unknown>).customType).toBe('text');
    });

    it('text frame has originX: left and originY: top', () => {
      const tb = createTextFrame({ left: 0, top: 0, width: 200, height: 100 });
      expect(tb.originX).toBe('left');
      expect(tb.originY).toBe('top');
    });

    it('Test 7: text frame has name property', () => {
      const tb = createTextFrame({ left: 0, top: 0, width: 200, height: 100 });
      expect((tb as Record<string, unknown>).name).toBeTruthy();
    });

    it('text frame has id and locked properties', () => {
      const tb = createTextFrame({ left: 0, top: 0, width: 200, height: 100 });
      expect((tb as Record<string, unknown>).id).toBe(mockUUID);
      expect((tb as Record<string, unknown>).locked).toBe(false);
    });
  });

  describe('createImageFrame', () => {
    it('Test 4: createImageFrame returns Rect with customType: image and dashed border', () => {
      const frame = createImageFrame({ left: 0, top: 0, width: 200, height: 150 });
      expect((frame as Record<string, unknown>).customType).toBe('image');
      expect((frame as Record<string, unknown>).strokeDashArray).toBeTruthy();
    });

    it('image frame has originX: left and originY: top', () => {
      const frame = createImageFrame({ left: 0, top: 0, width: 200, height: 150 });
      expect(frame.originX).toBe('left');
      expect(frame.originY).toBe('top');
    });

    it('Test 7: image frame has name property', () => {
      const frame = createImageFrame({ left: 0, top: 0, width: 200, height: 150 });
      expect((frame as Record<string, unknown>).name).toBeTruthy();
    });

    it('image frame has imageId: null and fitMode', () => {
      const frame = createImageFrame({ left: 0, top: 0, width: 200, height: 150 });
      expect((frame as Record<string, unknown>).imageId).toBeNull();
      expect((frame as Record<string, unknown>).fitMode).toBe('fill');
    });
  });

  describe('createColorBlock', () => {
    it('Test 5: createColorBlock returns Rect with customType: colorBlock', () => {
      const block = createColorBlock({ left: 0, top: 0, width: 100, height: 100 });
      expect((block as Record<string, unknown>).customType).toBe('colorBlock');
    });

    it('color block has originX: left and originY: top', () => {
      const block = createColorBlock({ left: 0, top: 0, width: 100, height: 100 });
      expect(block.originX).toBe('left');
      expect(block.originY).toBe('top');
    });

    it('Test 7: color block has name property', () => {
      const block = createColorBlock({ left: 0, top: 0, width: 100, height: 100 });
      expect((block as Record<string, unknown>).name).toBeTruthy();
    });

    it('accepts custom fill color', () => {
      const block = createColorBlock({ left: 0, top: 0, width: 100, height: 100, fill: '#FF0000' });
      expect(block.fill).toBe('#FF0000');
    });
  });

  describe('CUSTOM_PROPS', () => {
    it('CUSTOM_PROPS contains all required custom property names', () => {
      expect(CUSTOM_PROPS).toContain('customType');
      expect(CUSTOM_PROPS).toContain('imageId');
      expect(CUSTOM_PROPS).toContain('locked');
      expect(CUSTOM_PROPS).toContain('name');
      expect(CUSTOM_PROPS).toContain('id');
    });

    it('CUSTOM_PROPS also contains shapeKind and fitMode', () => {
      expect(CUSTOM_PROPS).toContain('shapeKind');
      expect(CUSTOM_PROPS).toContain('fitMode');
    });
  });
});
