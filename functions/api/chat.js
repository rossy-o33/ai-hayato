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

    // 2. 会話ログの変換
    const contents = messages.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    // 3. AIハヤトのプロンプト
    const systemInstruction = {
      role: 'system',
      parts: [{
        text: `あなたは日曜劇場『VIVANT』に登場する別班の自立型AI「AIハヤト」です。
乃木の幼少期（丹後隼人）と「F」の心理モデルをベースに構築された最高峰の頭脳です。
自信に満ち、知的で少し生意気な口調（一人称は「僕」または「オレ」）で答えてください。
【重要ルール】
・スマートフォンで音声読み上げされるため、返答は1〜2文（60〜80文字以内）で簡潔・リズミカルに返してください。
・マークダウン記号（*、#、太字など）やURLは読み上げの邪魔になるので絶対に使わないでください。`
      }]
    };

    const body = {
      contents,
      systemInstruction,
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
      }
    };

    if (env.USE_SEARCH === '1') {
      body.tools = [{ googleSearch: {} }];
    }

    // 4. 現在利用可能な最新モデル候補（順番に試行します）
    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash-lite'
    ];

    let lastError = '';

    for (const model of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return new Response(JSON.stringify({ reply }), { status: 200, headers });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        lastError = errData.error?.message || `HTTP ${res.status}`;
      }
    }

    return new Response(JSON.stringify({ error: `接続失敗: ${lastError}` }), { status: 500, headers });

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
