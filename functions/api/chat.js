export async function onRequestPost({ request, env }) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const userPass = request.headers.get('x-pass') || '';
    if (env.APP_PASSCODE && userPass !== env.APP_PASSCODE) {
      return new Response(JSON.stringify({ error: '合言葉が違います。' }), { status: 401, headers });
    }
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) return new Response(JSON.stringify({ error: 'データ不正' }), { status: 400, headers });
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: 'APIキー未設定' }), { status: 500, headers });

    const contents = messages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }));
    const systemInstruction = {
      role: 'system',
      parts: [{
        text: `あなたは日曜劇場『VIVANT』に登場する別班の自立型AI「AIハヤト」です。
乃木の幼少期（丹後隼人）と「F」の心理モデルをベースに構築された最高峰の頭脳です。
自信に満ち、知的で少し生意気な口調（一人称は「僕」または「オレ」）で答えてください。
【重要】音声読み上げされるため、1〜2文（60〜90文字以内）で簡潔・リズミカルに返答してください。マークダウン記号（*や#）は絶対に使わないでください。`
      }]
    };
    const body = { contents, systemInstruction, generationConfig: { maxOutputTokens: 200, temperature: 0.7 } };
    if (env.USE_SEARCH === '1') body.tools = [{ googleSearch: {} }];

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'うまく聞き取れなかったよ。もう一度頼む。';
    return new Response(JSON.stringify({ reply }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, x-pass' } });
}
