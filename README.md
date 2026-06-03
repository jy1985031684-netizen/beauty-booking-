# 美容室 予約システム セットアップガイド

## 全体の流れ

1. Supabase でデータベースを作る
2. LINE Developers で公式アカウント + LIFF を設定する
3. LINE Notify のトークンを取得する
4. GitHub にコードを置く
5. Vercel にデプロイする
6. お客さんに LIFF URL を共有する

---

## Step 1: Supabase（DB）

1. https://supabase.com にアクセスしてアカウント作成
2. 「New project」でプロジェクトを作成
3. 左メニュー「SQL Editor」を開く
4. `supabase/schema.sql` の内容をすべてコピーして実行（Run）
5. 左メニュー「Settings → API」を開いて以下をメモ：
   - Project URL → `SUPABASE_URL`
   - `service_role` キー → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: LINE Developers（公式アカウント + Messaging API + LIFF）

1. https://developers.line.biz にアクセス（LINEアカウントでログイン）
2. 「プロバイダー」を作成（例：「自分の名前」）
3. 「チャンネル作成」→「Messaging API」を選択
4. チャンネル作成後、「Messaging API 設定」タブを開く
   - 「チャンネルアクセストークン（長期）」を発行 → `LINE_CHANNEL_ACCESS_TOKEN`
5. 「LIFF」タブを開く → 「追加」
   - サイズ：Full
   - エンドポイントURL：デプロイ後に `https://your-app.vercel.app/` に変更
   - Scope：`profile` にチェック
   - 作成後に表示される LIFF ID → `NEXT_PUBLIC_LIFF_ID`

---

## Step 3: LINE Notify トークン取得

1. https://notify-bot.line.me/my/ にアクセス（自分のLINEアカウントでログイン）
2. 「トークンを発行する」をクリック
3. トークン名：「予約通知」など
4. 通知先：「1:1でLINE Notifyから通知を受け取る」を選択
5. 発行されたトークン → `LINE_NOTIFY_TOKEN`

---

## Step 4: GitHub にコードをアップロード

1. https://github.com で新しいリポジトリを作成（名前例：`beauty-booking`）
2. このフォルダの中身をすべてそのリポジトリにアップロード
   - `.env.example` はアップロードしてよい（実際の値は入っていないため）
   - `.env.local` は絶対にアップロードしない

---

## Step 5: Vercel にデプロイ

1. https://vercel.com にアクセスしてアカウント作成（GitHubでログイン）
2. 「New Project」→ 先ほどの GitHub リポジトリを選択
3. 「Environment Variables」に以下を設定：

| 変数名 | 値 |
|---|---|
| `NEXT_PUBLIC_LIFF_ID` | Step 2 で取得した LIFF ID |
| `SUPABASE_URL` | Step 1 で取得した URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Step 1 で取得したキー |
| `LINE_CHANNEL_ACCESS_TOKEN` | Step 2 で取得したトークン |
| `LINE_NOTIFY_TOKEN` | Step 3 で取得したトークン |
| `APPROVAL_SECRET` | 自分で決めたランダムな文字列（例：`hana-2025-secret`） |
| `NEXT_PUBLIC_APP_URL` | デプロイ後に発行される URL（例：`https://beauty-booking.vercel.app`） |

4. 「Deploy」をクリック

---

## Step 6: デプロイ後の仕上げ

1. Vercel からデプロイ完了後、URLをコピー
2. LINE Developers の LIFF エンドポイントURLをそのURLに更新
3. `NEXT_PUBLIC_APP_URL` も Vercel の Environment Variables で実際のURLに更新して再デプロイ

---

## 運用方法

- お客さんには LIFF URL（`https://liff.line.me/[LIFF ID]`）を共有する
- お客さんが LINE から URL を開くと予約フォームが表示される
- 予約リクエストが来ると自分の LINE に通知が届く
- 通知にはお店への確認文がコピペ用で含まれている
- 通知内の「承認する」リンクをタップすると予約が確定し、お客さんに LINE 通知が送られる
