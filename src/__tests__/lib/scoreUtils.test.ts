import { formatScore } from '../../lib/scoreUtils';

describe('formatScore', () => {
  it('renders whole numbers without a decimal', () => {
    expect(formatScore(7)).toBe('7');
    expect(formatScore(0)).toBe('0');
    expect(formatScore(40)).toBe('40');
  });

  it('renders one decimal for partial (descriptive) scores', () => {
    expect(formatScore(6.5)).toBe('6.5');
    expect(formatScore(0.7)).toBe('0.7');
  });

  it('rounds to one decimal place', () => {
    expect(formatScore(6.666)).toBe('6.7');
    expect(formatScore(2.04)).toBe('2');
  });
});
