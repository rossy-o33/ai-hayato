[README.md](https://github.com/user-attachments/files/34370610/README.md)
# AIハヤト セットアップ(無料構成)

構成: Cloudflare Pages(無料)+ Gemini API(無料枠)+ iPhone内蔵の音声認識/読み上げ

## 課金しないための約束
- Google AI Studio で APIキーを作るだけにする。Google Cloud の「請求先アカウント」は紐づけない(紐づけなければ請求は発生せず、上限で止まるだけ)
- Cloudflare は Free プランのまま。有料プランに変更しない

## 手順
1. https://aistudio.google.com でAPIキーを作成
2. このフォルダを GitHub にアップロード(または Cloudflare Pages の「Direct Upload」で `public` と `functions` を含むフォルダごとアップロード)
3. Cloudflare Pages でプロジェクト作成(ビルドコマンドなし、出力ディレクトリ: `public`)
4. 設定 → 環境変数(Secret)に登録
   - `GEMINI_API_KEY` : 手順1のキー
   - `APP_PASSCODE` : 友達に教える合言葉(他人に使われないため)
   - `USE_SEARCH` : `1` で最新情報の検索を有効化(任意。無料枠の検索回数に注意)
5. 発行されたURLをiPhoneのSafariで開く → 共有 → 「ホーム画面に追加」

## iPhoneでの使い方
- 最初に「起動」をタップ(音声を有効にするため)。マイク許可が出たら許可
- 音声認識がうまく動かないときは「文字入力」を開き、キーボードのマイクボタン(Siriの音声入力)で話す
- 「連続会話」をONにすると、返答のあと自動で聞き取りに戻る(止まったらマイクをタップ)

## 絵の差分(口・まばたき)の調整
`public/index.html` の SVG 部分で座標を変更できます(viewBox は 950×1500、元画像と同じ座標)。
