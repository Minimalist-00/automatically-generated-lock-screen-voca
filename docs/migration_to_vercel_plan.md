# Supabase から Vercel への完全移行計画 (Full Migration Plan)

## 概要 (Goal Description)
現在の Supabase (Database + Storage + Supabase-js クライアント) 依存のアーキテクチャから脱却し、Vercel Postgres (データベース) と Vercel Blob (画像ストレージ) への完全移行を行います。
また、フロントエンドから直接データベースを操作していたBaaS型のアプローチから、Next.jsのServer Actions経由で安全にデータベースを操作する標準的なフルスタックアプローチへコードを大改修します。

## ⚠️ 留意すべき重要な点 (User Review Required)

> [!WARNING]
> **1. クライアントからの直接接続の廃止**
> 現在は `supabase-js` を用いてブラウザ（Reactコンポーネント内）から直接データベースへ接続・操作していますが、Vercel Postgres ではセキュリティ上これができません。すべてのデータ操作（取得、追加、更新、削除）を Server Actions または API Routes に書き換える必要があります。
>
> **2. 画像ストレージの移行 (Vercel Blob)**
> 壁紙画像は Vercel Blob へ移行します。マイグレーション時に、既存の画像を Supabase からダウンロードし、Vercel Blob にアップロードし直して、新しいURLを発行する必要があります。
> 
> **3. Vercel Blobの設定の事前準備**
> Vercelダッシュボードにて、データベース（Postgres）を作成したのと同じ「Storage」タブから、新しく **「Blob」** も作成しておく必要があります。
>
> **4. 環境変数の追加**
> Vercel Blob を作成したら、`.env.local` に `BLOB_READ_WRITE_TOKEN` を追加する必要があります。（Vercel CLIで `vercel env pull` を行うか、ダッシュボードからコピーしてください）

## 決定事項 (Decisions)

> [!IMPORTANT]
> **ORM（データベース操作ライブラリ）の選定**
> 今回の大改修にあたり、既存のスキーマからの移行のしやすさ、型安全性、保守性の観点から **「Prisma」** を採用して進めます。

## 提案する変更内容 (Proposed Changes)

### 1. 依存パッケージと環境設定
- `@vercel/postgres` および `@vercel/blob` のインストール。
- ORMのインストール (`prisma` および `@prisma/client`)。
- 環境変数の更新（Vercel用の接続文字列、Blob用トークンなど）。
- `@supabase/supabase-js` 関連パッケージの削除。

#### [MODIFY] `package.json`
#### [MODIFY] `.env.local`
#### [NEW] `prisma/schema.prisma`

### 2. データ・画像の移行スクリプト (マイグレーション)
専用のNode.jsスクリプトを作成し、ローカル環境で以下の処理を一括実行します。
1. Supabase Storage から画像一覧を取得し、一時的にローカルへダウンロード。
2. ダウンロードした画像を Vercel Blob にアップロードし、新しい `public_url` を取得。
3. Supabase Database のテーブル (`words`, `wallpapers`, `quests`, `system_settings`) のレコードを取得。
4. Vercel Postgres 上にテーブル構造を作成し、レコードを挿入（このとき、画像のURLを新しい Vercel Blob のものに置換）。

#### [NEW] `scripts/migrate_to_vercel.mjs`

### 3. アプリケーションコードの大改修 (Data Access Layer)
フロントエンドの各コンポーネントから直接DBを触っていた処理を引き剥がし、Server Actionsを作成して置き換えます。

#### [NEW] `src/app/actions/words.ts` (単語用)
#### [NEW] `src/app/actions/wallpapers.ts` (壁紙用・Blobへのアップロード処理含む)
#### [NEW] `src/app/actions/quests.ts` (クエスト用)
#### [DELETE] `src/lib/supabase.ts`

### 4. フロントエンドコンポーネントの修正
新しい Server Actions を呼び出すように変更します。

#### [MODIFY] `src/contexts/StoreContext.tsx`
#### [MODIFY] `src/app/words/page.tsx`
#### [MODIFY] `src/app/wallpapers/page.tsx`
#### [MODIFY] `src/components/QuickAddFAB.tsx`
#### [MODIFY] `src/app/api/gemini-bulk/route.ts`
#### [MODIFY] `src/app/api/words/reorder/route.ts`

## 検証計画 (Verification Plan)
### 手動での検証 (Manual Verification)
1. ローカルサーバーを起動し、Vercel Postgresと通信できるか確認。
2. ホーム画面でのデータ取得、新しい単語の追加、並び替え、削除が正常に行えるか。
3. 壁紙管理画面での新規画像のアップロード（Vercel Blob）と削除が正常に行えるか。
4. **Supabaseの接続情報を `.env.local` から完全に削除しても、アプリが独立して正常に動作するか確認。**
