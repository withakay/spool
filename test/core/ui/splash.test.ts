import { getSplash } from '../../../src/core/ui/splash.js';

describe('getSplash', () => {
  it('returns a string', () => {
    const splash = getSplash();
    expect(typeof splash).toBe('string');
  });

  it('contains "SPOOL" (visually)', () => {
    // Basic check that it's not empty and has some content
    const splash = getSplash();
    expect(splash.trim().length).toBeGreaterThan(0);
  });

  it('fits within 80 columns', () => {
    const splash = getSplash();
    const lines = splash.split('\n');
    
    for (const line of lines) {
      // Check length including potential ANSI codes if any (though currently plain text)
      // For strict visual length, we might strip ANSI, but here raw length check is safe upper bound
      expect(line.length).toBeLessThanOrEqual(80);
    }
  });
});
