import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const info = JSON.parse(readFileSync(new URL('../../app-info.json', import.meta.url), 'utf8'));

describe('app-info.json（tomori-app-lab 一覧サイト連携）', () => {
  it('必須項目が入っている', () => {
    expect(info.id).toBe('010');
    for (const k of ['name', 'category', 'description', 'tagline', 'overview', 'icon', 'publishedAt']) {
      expect(typeof info[k], k).toBe('string');
      expect(info[k].length, k).toBeGreaterThan(0);
    }
    expect(['published', 'beta', 'coming-soon']).toContain(info.status);
    expect(info.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('使い方は3〜5ステップ', () => {
    expect(info.usageSteps.length).toBeGreaterThanOrEqual(3);
    expect(info.usageSteps.length).toBeLessThanOrEqual(5);
  });
  it('公開URLが正しい', () => {
    expect(info.appUrl).toBe('https://tomoricot-alt.github.io/tomori-ready-010/');
  });
  it('機能・できること・注意事項がある', () => {
    for (const k of ['capabilities', 'features', 'notes']) expect(info[k].length, k).toBeGreaterThan(0);
  });
});
