// functions/api/chat.js

export async function onRequestPost({ request, env }) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // 1. 合言葉の確認
    const userPass = request.headers.get('x-pass') || '';
    if (env.APP_PASSCODE && userPass !== env.APP_PASSCODE) {
      return new Response(JSON.stringify({ error: '合言葉が違います。' }), { status: 401, headers });
    }

    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'リクエストが不正です。' }), { status: 400, headers });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY が設定されていません。' }), { status: 500, headers });
    }

    // 2. 過去の会話ログを Gemini 形式に変換
    const contents = messages.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    // 3. AIハヤトのキャラクター設定
    const systemInstruction = {
      role: 'system',
      parts: [{
        text: `あなたは日曜劇場『VIVANT』に登場する別班の自立型AI「AIハヤト」です。
乃木の幼少期（丹後隼人）と「F」の心理モデルをベースに構築された最高峰の頭脳です。
自信に満ち、知的で少し生意気な口調（一人称は「僕」または「オレ」）で答えてください。
【重要ルール】
・スマートフォンで音声読み上げされるため、返答は1〜2文（長くても70文字以内）で簡潔かつリズミカルに返してください。
・マークダウン記号（*、#、太字など）やURLは読み上げの邪魔になるので絶対に使わないでください。`
      }]
    };

    // 4. 無料枠の安定版モデル gemini-1.5-flash を指定
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents,
      systemInstruction,
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
      }
    };

    // Google検索オプション
    if (env.USE_SEARCH === '1') {
      body.tools = [{ googleSearch: {} }];
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // エラーが起きた場合は具体的なエラー内容を返す
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || `Gemini API通信エラー (${res.status})`;
      return new Response(JSON.stringify({ error: errMsg }), { status: res.status, headers });
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return new Response(JSON.stringify({ error: 'AIから返答テキストを取得できませんでした。' }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ reply }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || '内部エラー' }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-pass',
    }
  });
}
