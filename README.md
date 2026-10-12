# 🎒 TOMORI READY（APP 010）

> あしたの じゅんび、できたかな？

TOMORI APP LAB 第10号。小学3・4年生が、学校へ持っていくものを**前の晩に確認**して忘れ物を減らすためのチェックリストアプリです。

- 公開URL: https://tomoricot-alt.github.io/tomori-ready-010/
- 一覧サイト: https://tomoricot-alt.github.io/tomori-app-lab/ （`app-info.json` を元に掲載）

## 主な機能

- 学校の持ち物チェックリスト（大きなチェックボタン・絵文字・チェック時のアニメーション）
- 月〜日曜日の曜日別テンプレート／曜日ごとの持ち物設定
- 「きょう」「あした」の切り替え表示（日曜の夜の「あした」は月曜）
- 準備できた数と達成率の表示、全部そろったときのお祝い表示
- 持ち物の追加・編集・削除（初期サンプルも含め、すべて編集可能）
- 端末内保存（サーバー・会員登録・広告・課金なし。個人情報は扱わない）

詳しい使い方は [docs/USER_GUIDE.md](docs/USER_GUIDE.md)、開発内容とテスト結果は [docs/DEV_REPORT.md](docs/DEV_REPORT.md) を参照してください。

## 技術

React Native / Expo (SDK 57) / TypeScript / React Native Web。保存は `@react-native-async-storage/async-storage`（Webでは `localStorage`）。

## データの保存

| キー | 内容 |
| --- | --- |
| `tomori-ready-010:templates:v1` | 持ち物の一覧と、曜日ごとのテンプレート |
| `tomori-ready-010:checks:v1` | 日付（`YYYY-MM-DD`）ごとのチェック状況 |

テンプレートと日付別チェックは**別のキー**に保存します。チェックは日付がキーなので、前日のチェックが翌日に引き継がれることはありません。60日より古いチェック記録は自動で削除します。

⚠️ **ブラウザの「サイトデータ」「閲覧履歴」を削除すると、設定とチェックも消えます。** 別の端末・別のブラウザには引き継がれません。

## 開発

```bash
npm ci
npm run web         # 開発サーバー（Web）
npm run typecheck   # TypeScript 型チェック
npm test            # ロジックの単体テスト（vitest）
npm run build       # Web ビルド（dist/、/tomori-ready-010/ 配下用）
npm run e2e         # ビルド済み dist を実ブラウザ(Chromium)で iPhone/PC 表示確認
npm run check       # typecheck + test + build
```

`npm run e2e` は Playwright の Chromium が必要です（`npx playwright install chromium`）。別の場所の Chromium を使うときは `CHROMIUM_PATH` を指定します。`SHOTS_DIR=<dir>` でスクリーンショットも保存できます。

## 構成

```
src/lib/        日付・持ち物・保存のロジック（純粋関数、テスト対象）
src/components/ チェック行・進捗カード・お祝い画面
src/screens/    じゅんび画面・せってい画面
scripts/e2e.mjs ブラウザ動作テスト
app-info.json   一覧サイト（tomori-app-lab）連携用の情報
```

## 公開（GitHub Pages）

1. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする（初回のみ）。
2. 作業ブランチで PR を作り、`CI`（型チェック・テスト・ビルド・E2E）が通ることを確認する。
3. 本人が確認・承認してから `main` へマージする。
4. `main` への反映で `.github/workflows/deploy.yml` が自動で再テストして公開する。

## 一覧サイトとの連携

リポジトリ直下の `app-info.json`（id: `010`）が、`tomori-app-lab` の `src/data/apps.ts` の `AppInfo` と同じ項目で、アプリの概要・機能・使い方・注意事項・公開URLを記録しています。一覧サイト側へは、この内容を `apps` 配列に1件追加して反映します（手順は tomori-app-lab の `docs/OPERATIONS.md`）。
