const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'Content-Type':'application/json'}});
export async function onRequestPost({request,env}){
  try{
    if(env.APP_PASSCODE&&request.headers.get('x-pass')!==env.APP_PASSCODE)return J({error:'auth'},401);
    const {text}=await request.json();
    if(!text||!env.GEMINI_API_KEY)return J({error:'bad'},400);
    const model=env.TTS_MODEL||'gemini-3.1-flash-tts-preview';
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
      method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},
      body:JSON.stringify({contents:[{parts:[{text:'Say in a calm, confident, slightly cocky young Japanese man\'s voice, at a brisk tempo: '+String(text).slice(0,300)}]}],
        generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:env.TTS_VOICE||'Orus'}}}}})});
    if(!res.ok)return J({error:'tts '+res.status},502);
    const d=await res.json();
    const audio=d.candidates?.[0]?.content?.parts?.find(p=>p.inlineData)?.inlineData?.data;
    return audio?J({audio}):J({error:'no audio'},502);
  }catch(e){return J({error:e.message},500)}
}
