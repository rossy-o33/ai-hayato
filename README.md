# AIハヤト v2

## 配置
既存プロジェクトの public/ と functions/ をこの中身で置き換えて、Cloudflare Pages に再デプロイします。

## 環境変数(Cloudflare Pages)
- GEMINI_API_KEY (必須)
- GEMINI_MODEL (任意: 使うモデルを固定。未設定なら gemini-3.5-flash などを順に試す)
- APP_PASSCODE (任意: 合言葉)
- USE_SEARCH=1 (任意: ニュースや天気など、必要な質問だけ検索を使う)
- TTS_MODEL (任意: 既定 gemini-3.1-flash-tts-preview。無料枠の有無はGoogle AI Studioで要確認)
- TTS_VOICE (任意: 既定 Orus。声はAI Studioの試聴で選べます)

## 高音質ボイスについて
Gemini音声合成が失敗・上限到達した場合は、自動でiPhone内蔵の読み上げに切り替わります。
