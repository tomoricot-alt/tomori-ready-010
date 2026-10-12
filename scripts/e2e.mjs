// ビルド済み dist/ を GitHub Pages と同じ /tomori-ready-010/ 配下で配信し、実ブラウザで動作確認する。
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium, devices } from 'playwright';
import assert from 'node:assert/strict';

const BASE = '/tomori-ready-010/';
const DIST = new URL('../dist', import.meta.url).pathname;
const SHOTS = process.env.SHOTS_DIR;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.ico': 'image/x-icon', '.json': 'application/json', '.png': 'image/png' };

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!path.startsWith(BASE)) { res.writeHead(404).end(); return; }
  let rel = normalize(path.slice(BASE.length)).replace(/^(\.\.[/\\])+/, '') || 'index.html';
  try {
    const body = await readFile(join(DIST, rel));
    res.writeHead(200, { 'content-type': types[extname(rel)] ?? 'application/octet-stream' }).end(body);
  } catch {
    const body = await readFile(join(DIST, 'index.html'));
    res.writeHead(200, { 'content-type': types['.html'] }).end(body);
  }
}).listen(0);
await new Promise((r) => server.once('listening', r));
const URL_ = `http://localhost:${server.address().port}${BASE}`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let failed = 0;
const run = async (name, fn) => {
  try { await fn(); console.log('✓', name); } catch (e) { failed++; console.error('✗', name, '\n ', e.message); }
};

// 日曜 2026-10-11 19:00 に開く（あした＝月曜日）
const SUNDAY_EVENING = new Date(2026, 9, 11, 19, 0, 0);

async function openPage(contextOptions, label) {
  const context = await browser.newContext({ locale: 'ja-JP', ...contextOptions });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.clock.install({ time: SUNDAY_EVENING });
  await page.goto(URL_);
  await page.getByText('あしたの じゅんび、できたかな？').waitFor();
  return { context, page, errors, label };
}
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` }); };
const noOverflow = async (page) => {
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  assert.ok(w[0] <= w[1], `横スクロールが発生: ${w}`);
};
const count = async (page) => (await page.getByTestId('progress-count').innerText()).replace(/\s+/g, ' ');

const targets = [
  ['iPhone', devices['iPhone 13']],
  ['PC', { viewport: { width: 1280, height: 800 } }],
];

for (const [label, opts] of targets) {
  const { context, page, errors } = await openPage(opts, label);

  await run(`[${label}] 初期表示：日曜夜は「あした」＝月曜の8個 / 横スクロールなし`, async () => {
    assert.match(await page.getByTestId('date-label').innerText(), /あした 10月12日（月） の もちもの/);
    assert.equal(await page.getByRole('checkbox').count(), 8);
    assert.match(await count(page), /0 \/ 8/);
    await noOverflow(page);
    await shot(page, `${label}-ready`);
  });

  await run(`[${label}] チェック→達成率→お祝い`, async () => {
    await page.getByTestId('row-ランドセル').click();
    await page.getByTestId('row-ふでばこ').click();
    assert.match(await count(page), /2 \/ 8/);
    assert.equal((await page.getByTestId('progress-percent').innerText()).trim(), '25%');
    await page.getByTestId('row-ランドセル').click(); // はずす
    assert.match(await count(page), /1 \/ 8/);
    await page.getByTestId('row-ランドセル').click();
    for (const n of ['教科書', 'ノート', 'ハンカチ', 'ティッシュ', '水とう']) await page.getByTestId(`row-${n}`).click();
    assert.equal(await page.getByTestId('celebration').count(), 0);
    await page.getByTestId('row-連絡帳').click();
    await page.getByTestId('celebration').waitFor();
    assert.equal((await page.getByTestId('progress-percent').innerText()).trim(), '100%');
    await page.waitForTimeout(700); await shot(page, `${label}-celebration`);
    await page.getByTestId('celebration-close').click();
    assert.equal(await page.getByTestId('celebration').count(), 0);
    await shot(page, `${label}-done`);
  });

  await run(`[${label}] 再読み込み後もチェックが残る`, async () => {
    await page.reload();
    await page.getByTestId('progress-count').waitFor();
    assert.match(await count(page), /8 \/ 8/);
    assert.equal(await page.getByTestId('celebration').count(), 0, '読み込み直後にお祝いは出さない');
  });

  await run(`[${label}] きょう（日曜）は持ち物なし／きょう・あしたの切り替え`, async () => {
    await page.getByTestId('target-today').click();
    await page.getByTestId('empty').waitFor();
    assert.match(await page.getByTestId('date-label').innerText(), /きょう 10月11日（日） の/);
    await page.getByTestId('target-tomorrow').click();
    assert.match(await count(page), /8 \/ 8/);
  });

  await run(`[${label}] 日付が月曜に変わると、月曜のチェックは「きょう」に残り、火曜は未チェック`, async () => {
    await page.clock.setSystemTime(new Date(2026, 9, 12, 7, 0, 0));
    await page.clock.runFor(16000); // 定期更新を発火
    await page.getByTestId('target-today').click();
    assert.match(await page.getByTestId('date-label').innerText(), /きょう 10月12日（月） の/);
    assert.match(await count(page), /8 \/ 8/);
    await page.getByTestId('target-tomorrow').click();
    assert.match(await page.getByTestId('date-label').innerText(), /あした 10月13日（火） の/);
    assert.match(await count(page), /0 \/ 8/, '前日のチェックが引き継がれていない');
    await page.getByTestId('row-ノート').click();
    await page.getByTestId('target-today').click();
    assert.match(await count(page), /8 \/ 8/, 'あしたのチェックがきょうに影響していない');
  });

  await run(`[${label}] 設定：追加・編集・曜日設定・削除と保存`, async () => {
    await page.getByTestId('tab-settings').click();
    await page.getByTestId('day-火').click();
    await page.getByTestId('suggest-習字セット').click();           // 火曜に追加
    await page.getByTestId('new-name').fill('リコーダー');
    await page.getByTestId('new-add').click();                      // 火曜に追加
    await page.getByTestId('toggle-リコーダー').waitFor();
    // 習字セットを編集
    await page.getByTestId('edit-習字セット').click();
    await page.getByTestId('edit-name').fill('しゅうじセット');
    await page.getByTestId('edit-save').click();
    await page.getByTestId('toggle-しゅうじセット').waitFor();
    // 水曜には入れていないので「なし」
    await page.getByTestId('day-水').click();
    assert.equal(await page.getByTestId('toggle-しゅうじセット').innerText(), 'なし');
    await page.getByTestId('toggle-しゅうじセット').click();
    assert.equal(await page.getByTestId('toggle-しゅうじセット').innerText(), 'あり');
    // 削除
    await page.getByTestId('delete-ティッシュ').click();
    await page.getByTestId('delete-confirm').click();
    assert.equal(await page.getByTestId('toggle-ティッシュ').count(), 0);
    await shot(page, `${label}-settings`);

    await page.reload();
    await page.getByTestId('tab-settings').click();
    await page.getByTestId('day-火').click();
    assert.equal(await page.getByTestId('toggle-しゅうじセット').innerText(), 'あり');
    assert.equal(await page.getByTestId('toggle-リコーダー').innerText(), 'あり');
    assert.equal(await page.getByTestId('toggle-ティッシュ').count(), 0);
    // 準備画面にも反映（あした＝火曜：7+2=9個）
    await page.getByTestId('tab-ready').click();
    await page.getByTestId('target-tomorrow').click();
    assert.equal(await page.getByRole('checkbox').count(), 9);
    assert.match(await count(page), /1 \/ 9/, '保存済みのノートのチェックは残る');
    await noOverflow(page);
  });

  await run(`[${label}] JavaScriptエラーなし`, async () => assert.deepEqual(errors, []));
  await context.close();
}

await browser.close();
server.close();
if (failed) { console.error(`\n${failed} 件失敗`); process.exit(1); }
console.log('\nE2E: すべて成功');
