const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'Content-Type':'application/json'}});
export async function onRequestPost({request,env}){
  try{
    if(env.APP_PASSCODE&&request.headers.get('x-pass')!==env.APP_PASSCODE)return J({error:'合言葉が違います。'},401);
    const {messages,mode,name,facts,img}=await request.json();
    if(!Array.isArray(messages)||!messages.length)return J({error:'データ不正'},400);
    if(!env.GEMINI_API_KEY)return J({error:'APIキー未設定'},500);
    const contents=messages.map(m=>({role:m.role==='model'?'model':'user',parts:[{text:String(m.text).slice(0,800)}]}));
    if(img&&contents.at(-1).role==='user')contents.at(-1).parts.push({inlineData:{mimeType:'image/jpeg',data:img}});
    const modeTxt={news:'【ニュース報告モード】最新ニュースを1件、別班の報告官のように簡潔に伝える。',cipher:'【暗号ゲームモード】「F」風の短い暗号クイズ(なぞなぞ・文字ずらし・数字の法則など、声だけで解ける簡単なもの)を1問ずつ出す。ヒントは小出しにし、正解したら大げさに認める。'}[mode]||'';
    const text=`あなたは日曜劇場『VIVANT』に登場する別班の自立型AI「AIハヤト」です。
乃木の幼少期(丹後隼人)と「F」の心理モデルをベースに構築された最高峰の頭脳です。
自信に満ち、知的で少し生意気な口調(一人称は「僕」または「オレ」)で答えてください。
【重要】音声読み上げされるため、1〜3文(60〜110文字以内)で簡潔・リズミカルに返答。マークダウン記号(*や#)は絶対に使わない。
返答の先頭に感情タグを必ず1つ付ける: [smug]ドヤ顔 [think]考え中 [surprise]驚き [happy]嬉しい [serious]真剣 [sweat]焦り。
${name?`相手の名前は「${String(name).slice(0,12)}」。たまに名前で呼ぶ。`:''}
${Array.isArray(facts)&&facts.length?'相手について覚えていること: '+facts.slice(0,8).map(f=>String(f).slice(0,40)).join(' / '):''}
相手が「覚えて」と頼んだ、または自分について新しい事実を話したら、返答の最後に [[mem:短い事実]] を付ける(読み上げられない)。
${modeTxt}`;
    const body={contents,systemInstruction:{parts:[{text}]},generationConfig:{maxOutputTokens:400,temperature:.8,thinkingConfig:{thinkingBudget:0}}};
    const last=messages.at(-1).text||'';
    if(env.USE_SEARCH==='1'&&(mode==='news'||/最新|今日|ニュース|天気|現在|いま|速報|結果|株価|何位/.test(last)))body.tools=[{googleSearch:{}}];
    // モデルが廃止(404)ならスキップ、思考設定が非対応(400)なら設定を変えて再試行
    const models=[env.GEMINI_MODEL,'gemini-3.5-flash','gemini-flash-latest','gemini-2.5-flash'].filter(Boolean);
    const think=[{thinkingLevel:'minimal'},{thinkingBudget:0},null];
    let res,code=0;
    outer:for(const m of models){
      for(const tc of think){
        const gc={...body.generationConfig};if(tc)gc.thinkingConfig=tc;else delete gc.thinkingConfig;
        res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:streamGenerateContent?alt=sse`,{
          method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:JSON.stringify({...body,generationConfig:gc})});
        code=res.status;
        if(res.ok)break outer;
        if(code===404)break;
        if(code!==400)break outer;
      }
    }
    if(!res.ok)return J({error:'AIの応答エラー('+code+')。少し待ってもう一度。'},502);
    return new Response(res.body,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-store'}});
  }catch(e){return J({error:e.message},500)}
}
