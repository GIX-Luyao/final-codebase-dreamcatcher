/**
 * Unicode sparkline rendering using block characters.
 */

const SPARK_CHARS = '\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588';

/**
 * Render a sparkline from an array of numeric values.
 * Returns a string of Unicode block characters.
 */
export function sparkline(values: number[], width: number = 10): string {
  const recent = values.slice(-width);
  if (recent.length === 0) return SPARK_CHARS[0].repeat(width);

  const min = Math.min(...recent);
  const max = Math.max(...recent);
  const range = max - min || 1;

  const chars = recent.map(v => {
    const idx = Math.round(((v - min) / range) * 7);
    return SPARK_CHARS[idx];
  });

  // Pad with lowest bar if we have fewer values than width
  while (chars.length < width) {
    chars.unshift(SPARK_CHARS[0]);
  }

  return chars.join('');
}
