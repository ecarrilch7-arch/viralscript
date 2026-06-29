import { useState, useEffect } from "react";

const STORAGE_KEY = "viralscript_config";
function loadConfig() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveConfig(cfg) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); }

const LANGUAGES = [
  { code: "es-latam", label: "Español neutro latinoamericano" },
  { code: "es-es", label: "Español (España)" },
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
];
const STYLES = [
  { code: "reflexivo", label: "Reflexivo y profundo" },
  { code: "motivacional", label: "Motivacional y energético" },
  { code: "espiritual", label: "Espiritual y sereno" },
  { code: "narrativo", label: "Narrativo y evocador" },
];

async function searchYouTube(query, config, filters = {}) {
  const params = new URLSearchParams({ part: "snippet", q: query, type: "video", maxResults: 20, key: config.youtubeKey, relevanceLanguage: filters.language || "es", videoDuration: filters.duration || "any", order: "viewCount" });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!res.ok) throw new Error("Error con la API de YouTube.");
  return (await res.json()).items || [];
}
async function getVideoStats(videoIds, config) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds.join(",")}&key=${config.youtubeKey}`);
  if (!res.ok) throw new Error("Error obteniendo estadísticas.");
  return (await res.json()).items || [];
}
async function getChannelStats(channelIds, config) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds.join(",")}&key=${config.youtubeKey}`);
  if (!res.ok) throw new Error("Error obteniendo datos del canal.");
  return (await res.json()).items || [];
}
async function searchPexels(query, config) {
  const res = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=6&orientation=portrait`, { headers: { Authorization: config.pexelsKey } });
  if (!res.ok) return [];
  return (await res.json()).videos || [];
}
async function searchPixabay(query, config) {
  const res = await fetch(`https://pixabay.com/api/videos/?key=${config.pixabayKey}&q=${encodeURIComponent(query)}&per_page=6`);
  if (!res.ok) return [];
  return (await res.json()).hits || [];
}
async function callClaude(prompt, config) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: config.anthropicKey,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error("Error con la API de Anthropic.");
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

function parseDuration(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1]||0)*3600)+(parseInt(m[2]||0)*60)+(parseInt(m[3]||0));
}
function formatDuration(s) {
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;
  return h>0?`${h}h ${m}m`:`${m}m ${sc}s`;
}
function formatNumber(n) {
  if(!n)return"0";const num=parseInt(n);
  if(num>=1000000)return(num/1000000).toFixed(1)+"M";
  if(num>=1000)return(num/1000).toFixed(1)+"K";
  return num.toString();
}
function outlierScore(views,subs){return(!subs||subs===0)?0:(views/subs).toFixed(1);}
const C = {
  bg:"#0a0a0f",surf:"#111118",card:"#16161f",bord:"#222230",
  acc:"#6c3fff",accS:"#6c3fff22",accH:"#8b5fff",
  gold:"#f0b429",goldS:"#f0b42922",
  txt:"#e8e8f0",muted:"#7878a0",dim:"#4a4a6a",
  ok:"#22c55e",err:"#ef4444",tag:"#1e1e2e",
};

const css=`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#0a0a0f;color:#e8e8f0;font-family:'Inter',sans-serif;min-height:100vh;}
.app{display:flex;min-height:100vh;}
.sidebar{width:220px;min-height:100vh;background:#111118;border-right:1px solid #222230;display:flex;flex-direction:column;padding:24px 0;position:fixed;top:0;left:0;z-index:100;}
.slogo{padding:0 20px 28px;border-bottom:1px solid #222230;margin-bottom:16px;}
.ltxt{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;letter-spacing:-0.5px;}
.lacc{color:#6c3fff;}
.lsub{font-size:11px;color:#7878a0;margin-top:2px;letter-spacing:0.5px;}
.nitem{display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;font-size:13.5px;font-weight:500;color:#7878a0;transition:all 0.15s;border-left:3px solid transparent;margin:1px 0;}
.nitem:hover,.nitem.active{background:#6c3fff22;color:#e8e8f0;border-left-color:#6c3fff;}
.main{margin-left:220px;flex:1;padding:32px 36px;min-height:100vh;}
.ptitle{font-family:'Syne',sans-serif;font-size:26px;font-weight:700;letter-spacing:-0.5px;margin-bottom:4px;}
.psub{color:#7878a0;font-size:14px;margin-bottom:28px;}
.card{background:#16161f;border:1px solid #222230;border-radius:12px;padding:20px;margin-bottom:16px;transition:border-color 0.2s;}
.card:hover{border-color:#6c3fff;}
.lbl{font-size:12px;font-weight:600;color:#7878a0;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;display:block;}
.inp{width:100%;background:#111118;border:1px solid #222230;border-radius:8px;padding:10px 14px;color:#e8e8f0;font-size:14px;font-family:'Inter',sans-serif;outline:none;transition:border-color 0.15s;}
.inp:focus{border-color:#6c3fff;}
.inp::placeholder{color:#4a4a6a;}
.btn{padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all 0.15s;font-family:'Inter',sans-serif;display:inline-flex;align-items:center;gap:8px;}
.bp{background:#6c3fff;color:white;}.bp:hover{background:#8b5fff;}.bp:disabled{opacity:0.4;cursor:not-allowed;}
.bs{background:#1e1e2e;color:#e8e8f0;border:1px solid #222230;}.bs:hover{border-color:#6c3fff;}
.bg{background:#f0b429;color:#0a0a0f;}.bg:hover{background:#f5c842;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;}
.tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#1e1e2e;color:#7878a0;border:1px solid #222230;}
.ta{background:#6c3fff22;color:#6c3fff;border-color:#6c3fff44;}
.tg{background:#f0b42922;color:#f0b429;border-color:#f0b42944;}
.tok{background:#22c55e22;color:#22c55e;border-color:#22c55e44;}
.srow{display:flex;gap:20px;flex-wrap:wrap;margin:10px 0;}
.sc{background:#111118;border:1px solid #222230;border-radius:10px;padding:16px;margin-bottom:12px;}
.sh{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.sn{width:28px;height:28px;background:#6c3fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0;}
.stxt{background:#0a0a0f;border-radius:8px;padding:12px;font-size:14px;line-height:1.6;color:#e8e8f0;margin-bottom:10px;white-space:pre-wrap;}
.pbox{background:#0d1117;border:1px dashed #222230;border-radius:8px;padding:10px 12px;font-size:12px;color:#7878a0;font-family:monospace;line-height:1.5;margin-bottom:8px;}
.alert{padding:12px 16px;border-radius:8px;font-size:13px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px;}
.aerr{background:#ef444420;border:1px solid #ef444444;color:#fca5a5;}
.aok{background:#22c55e20;border:1px solid #22c55e44;color:#86efac;}
.ainf{background:#6c3fff22;border:1px solid #6c3fff44;color:#a78bfa;}
.loader{display:flex;flex-direction:column;align-items:center;gap:16px;padding:48px;color:#7878a0;font-size:14px;}
.spin{width:36px;height:36px;border:3px solid #222230;border-top-color:#6c3fff;border-radius:50%;animation:spin 0.8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.vc{background:#16161f;border:1px solid #222230;border-radius:10px;overflow:hidden;cursor:pointer;transition:all 0.2s;}
.vc:hover{border-color:#6c3fff;transform:translateY(-2px);}
.vt{position:relative;aspect-ratio:16/9;background:#111118;overflow:hidden;}
.vt img{width:100%;height:100%;object-fit:cover;}
.vd{position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.85);color:white;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;}
.ob{position:absolute;top:6px;left:6px;background:#f0b429;color:#0a0a0f;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;}
.vi{padding:12px;}
.vtit{font-size:13px;font-weight:500;line-height:1.4;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.frow{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:flex-end;}
.fi{display:flex;flex-direction:column;min-width:140px;}
.kwr{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.kw{padding:4px 12px;border-radius:20px;font-size:12px;background:#6c3fff22;color:#6c3fff;border:1px solid #6c3fff33;cursor:pointer;}
.kw:hover,.kw.sel{background:#6c3fff;color:white;}
.cgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;}
.ci{border-radius:6px;overflow:hidden;aspect-ratio:9/16;background:#111118;position:relative;}
.ci video{width:100%;height:100%;object-fit:cover;}
.csrc{position:absolute;bottom:4px;right:4px;font-size:9px;background:rgba(0,0,0,0.7);color:white;padding:1px 5px;border-radius:3px;}
.cbtn{background:transparent;border:1px solid #222230;color:#7878a0;font-size:11px;padding:3px 8px;border-radius:5px;cursor:pointer;}
.cbtn:hover{border-color:#6c3fff;color:#6c3fff;}
.tabs{display:flex;gap:4px;margin-bottom:20px;background:#111118;padding:4px;border-radius:10px;}
.tab{flex:1;padding:8px;text-align:center;border-radius:7px;cursor:pointer;font-size:13px;font-weight:500;color:#7878a0;transition:all 0.15s;border:none;background:transparent;font-family:'Inter',sans-serif;}
.tab.active{background:#6c3fff;color:white;}
.div{height:1px;background:#222230;margin:20px 0;}
@media(max-width:768px){
  .sidebar{width:56px;}
  .slogo .ltxt,.slogo .lsub,.nitem span{display:none;}
  .nitem{justify-content:center;padding:12px 0;}
  .main{margin-left:56px;padding:16px 14px;}
  .g2,.g3{grid-template-columns:1fr;}
  .frow{flex-direction:column;}
  .fi{min-width:100%;}
  .ptitle{font-size:20px;}
  .cgrid{grid-template-columns:repeat(2,1fr);}
}
`;

function CopyBtn({text}){
  const [c,setC]=useState(false);
  return <button className="cbtn" onClick={()=>{navigator.clipboard.writeText(text);setC(true);setTimeout(()=>setC(false),1500);}}>{c?"✓ Copiado":"Copiar"}</button>;
}

function Sidebar({page,setPage,configured}){
  const nav=[
    {id:"config",icon:"⚙️",label:"Configuración"},
    {id:"research",icon:"🔍",label:"Investigar Nichos",req:true},
    {id:"analyzer",icon:"🎯",label:"Analizar Video",req:true},
    {id:"shorts",icon:"⚡",label:"Generar Shorts",req:true},
    {id:"longform",icon:"📽️",label:"Videos Largos",req:true},
  ];
  return(
    <div className="sidebar">
      <div className="slogo">
        <div className="ltxt"><span className="lacc">Viral</span>Script</div>
        <div className="lsub">CONTENT STUDIO</div>
      </div>
      {nav.map(n=>(
        <div key={n.id} className={`nitem${page===n.id?" active":""}`}
          style={{opacity:n.req&&!configured?0.35:1,cursor:n.req&&!configured?"not-allowed":"pointer"}}
          onClick={()=>(!n.req||configured)&&setPage(n.id)}>
          <span>{n.icon}</span><span>{n.label}</span>
        </div>
      ))}
    </div>
  );
}
function ConfigPage({config,setConfig}){
  const [form,setForm]=useState(config||{youtubeKey:"",pexelsKey:"",pixabayKey:"",anthropicKey:"",language:"es-latam",style:"reflexivo",channelName:"",niche:""});
  const [saved,setSaved]=useState(false);
  const save=()=>{saveConfig(form);setConfig(form);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const ok=form.youtubeKey&&form.pexelsKey&&form.anthropicKey;
  return(
    <div>
      <div className="ptitle">Configuración</div>
      <div className="psub">Completa estos datos una sola vez.</div>
      {saved&&<div className="alert aok">✓ Guardado correctamente.</div>}
      <div className="card">
        <div style={{fontSize:15,fontWeight:700,marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${C.bord}`}}>🔑 API Keys</div>
        {[{k:"youtubeKey",l:"YouTube Data API Key",p:"AIza..."},{k:"pexelsKey",l:"Pexels API Key",p:"Tu clave Pexels"},{k:"pixabayKey",l:"Pixabay API Key (opcional)",p:"Tu clave Pixabay"},{k:"anthropicKey",l:"Anthropic API Key",p:"sk-ant-..."}].map(({k,l,p})=>(
          <div key={k} style={{marginBottom:14}}>
            <label className="lbl">{l}</label>
            <input className="inp" type="password" placeholder={p} value={form[k]||""} onChange={f(k)}/>
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{fontSize:15,fontWeight:700,marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${C.bord}`}}>🎙️ Preferencias</div>
        <div className="g2">
          <div><label className="lbl">Idioma</label><select className="inp" value={form.language} onChange={f("language")}>{LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
          <div><label className="lbl">Estilo</label><select className="inp" value={form.style} onChange={f("style")}>{STYLES.map(s=><option key={s.code} value={s.code}>{s.label}</option>)}</select></div>
          <div><label className="lbl">Nombre del canal</label><input className="inp" placeholder="Mi canal..." value={form.channelName||""} onChange={f("channelName")}/></div>
          <div><label className="lbl">Nicho principal</label><input className="inp" placeholder="Espiritualidad..." value={form.niche||""} onChange={f("niche")}/></div>
        </div>
      </div>
      <button className="btn bp" onClick={save} disabled={!ok} style={{width:"100%",justifyContent:"center",padding:14}}>{ok?"💾 Guardar configuración":"Completa las API keys para continuar"}</button>
    </div>
  );
}

function ResearchPage({config}){
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [videos,setVideos]=useState([]);
  const [filters,setFilters]=useState({duration:"long",language:"en",maxSubs:100000});
  const [aiKw,setAiKw]=useState([]);
  const [loadKw,setLoadKw]=useState(false);
  const defKw=["spiritual awakening","personal growth","mindfulness meditation","law of attraction","stoicism","self discipline","inner peace","healing prayer","faith and anxiety","consciousness"];
  const genKw=async()=>{
    setLoadKw(true);
    try{
      const p=`Genera 8 keywords en inglés para buscar videos virales de YouTube en el nicho de "${config.niche||"desarrollo personal"}". Canales faceless, videos largos. Responde SOLO con JSON array de strings.`;
      const t=await callClaude(p,config);
      setAiKw(JSON.parse(t.replace(/```json|```/g,"").trim()));
    }catch{setAiKw(defKw.slice(0,8));}
    setLoadKw(false);
  };
  const search=async(kw)=>{
    const q=kw||query;if(!q.trim())return;
    setLoading(true);setError("");setVideos([]);
    try{
      const items=await searchYouTu
      function AnalyzerPage({config}){
  const [url,setUrl]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState(null);
  const [lang,setLang]=useState(config.language);
  const analyze=async()=>{
    const m=url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if(!m){setError("URL inválida.");return;}
    setLoading(true);setError("");setResult(null);
    try{
      const stats=await getVideoStats([m[1]],config);
      const v=stats[0];if(!v)throw new Error("Video no encontrado.");
      const langLabel=LANGUAGES.find(l=>l.code===lang)?.label||"español";
      const styleLabel=STYLES.find(s=>s.code===config.style)?.label||"reflexivo";
      const prompt=`Analiza este video viral y genera 3 ideas adaptadas.\nVIDEO: "${v.snippet?.title}"\nDESCRIPCIÓN: ${v.snippet?.description?.slice(0,400)||""}\n\nResponde SOLO en JSON válido sin caracteres especiales problemáticos:\n{"estructura":{"hook":"descripcion corta","desarrollo":"descripcion corta","cierre":"descripcion corta"},"ideas":[{"titulo":"titulo","hook":"hook corto","estructura":"estructura","miniatura":"concepto","palabrasClave":["kw1","kw2"]}]}\n\n3 ideas en ${langLabel}, estilo ${styleLabel}, canal faceless. Solo JSON sin markdown.`;
      const text=await callClaude(prompt,config);
      const clean=text.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      setResult({video:v,parsed,views:formatNumber(parseInt(v.statistics?.viewCount||0)),dur:formatDuration(parseDuration(v.contentDetails?.duration))});
    }catch(e){setError(e.message);}
    setLoading(false);
  };
  return(
    <div>
      <div className="ptitle">🎯 Analizar Video</div>
      <div className="psub">Pega la URL de un video outlier y obtén su estructura + 3 ideas.</div>
      <div className="card">
        <div className="frow">
          <div className="fi" style={{flex:3}}><label className="lbl">URL del video</label><input className="inp" placeholder="https://youtube.com/watch?v=..." value={url} onChange={e=>setUrl(e.target.value)}/></div>
          <div className="fi"><label className="lbl">Idioma salida</label><select className="inp" value={lang} onChange={e=>setLang(e.target.value)}>{LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
          <button className="btn bp" onClick={analyze} disabled={loading||!url.trim()}>{loading?"⏳":"Analizar"}</button>
        </div>
      </div>
      {error&&<div className="alert aerr">⚠️ {error}</div>}
      {loading&&<div className="loader"><div className="spin"/><span>Analizando estructura...</span></div>}
      {result&&<>
        <div className="card">
          <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>{result.video.snippet?.title}</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:14}}>{result.video.snippet?.channelTitle} · {result.views} vistas · {result.dur}</div>
          {Object.entries(result.parsed.estructura).map(([k,v])=>(
            <div key={k} style={{marginBottom:10}}><span className="tag ta" style={{marginBottom:5,display:"inline-block"}}>{k.toUpperCase()}</span><div style={{fontSize:13,marginTop:4,lineHeight:1.6}}>{v}</div></div>
          ))}
        </div>
        <div style={{fontSize:17,fontWeight:700,margin:"20px 0 14px"}}>3 Ideas generadas</div>
        {result.parsed.ideas.map((idea,i)=>(
          <div key={i} className="card">
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div style={{fontSize:15,fontWeight:700}}>{idea.titulo}</div><span className="tag tg">Idea {i+1}</span></div>
            <div style={{marginBottom:8}}><span className="lbl">Hook</span><div style={{fontSize:13,marginTop:4}}>{idea.hook}</div></div>
            <div style={{marginBottom:8}}><span className="lbl">Estructura</span><div style={{fontSize:13,marginTop:4}}>{idea.estructura}</div></div>
            <div style={{marginBottom:8}}><span className="lbl">Miniatura</span><div style={{fontSize:13,marginTop:4}}>{idea.miniatura}</div></div>
            <div className="kwr">{idea.palabrasClave?.map(kw=><span key={kw} className="tag ta">{kw}</span>)}</div>
          </div>
        ))}
      </>}
    </div>
  );
}

function ShortsPage({config}){
  const [topic,setTopic]=useState("");
  const [lang,setLang]=useState(config.language);
  const [style,setStyle]=useState(config.style);
  const [loadin
         function LongFormPage({config}){
  const [topic,setTopic]=useState("");
  const [duration,setDuration]=useState("30");
  const [lang,setLang]=useState(config.language);
  const [style,setStyle]=useState(config.style);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [script,setScript]=useState(null);
  const [clips,setClips]=useState({});
  const [loadClips,setLoadClips]=useState({});
  const [open,setOpen]=useState(1);
  const generate=async()=>{
    if(!topic.trim())return;
    setLoading(true);setError("");setScript(null);setClips({});
    try{
      const lL=LANGUAGES.find(l=>l.code===lang)?.label||"español neutro";
      const sL=STYLES.find(s=>s.code===style)?.label||"reflexivo";
      const n=duration==="60"?8:duration==="45"?6:duration==="20"?4:duration==="15"?3:duration==="10"?2:5;
      const prompt=`Crea estructura de video de ${duration} minutos sobre: "${topic}"\nIdioma: ${lL}, Estilo: ${sL}, ${n} escenas, canal faceless.\n\nResponde SOLO en JSON válido:\n{"titulo":"titulo SEO","descripcion":"descripcion YouTube 150 palabras","duracion_total":"${duration} minutos","palabras_clave":["kw1","kw2","kw3","kw4","kw5"],"escenas":[{"numero":1,"tipo":"INTRO","titulo_bloque":"nombre bloque","duracion":"X min","guion":"guion minimo 100 palabras","prompt_video":"prompt ingles detallado","busqueda_clip":"keyword ingles"}]}\nTipos: INTRO, DESARROLLO, CIERRE. Solo JSON sin markdown.`;
      const text=await callClaude(prompt,config);
      const clean=text.replace(/```json|```/g,"").trim();
      setScript(JSON.parse(clean));
      setOpen(1);
    }catch(e){setError("Error generando. Verifica tu Anthropic API key.");}
    setLoading(false);
  };
  const fetchClips=async(e)=>{
    setLoadClips(p=>({...p,[e.numero]:true}));
    try{
      const[px,pb]=await Promise.all([searchPexels(e.busqueda_clip,config),config.pixabayKey?searchPixabay(e.busqueda_clip,config):[]]);
      setClips(p=>({...p,[e.numero]:{px,pb}}));
    }catch{}
    setLoadClips(p=>({...p,[e.numero]:false}));
  };
  const sc={INTRO:C.gold,DESARROLLO:C.acc,CIERRE:C.ok};
  return(
    <div>
      <div className="ptitle">📽️ Videos Largos</div>
      <div className="psub">Script por escenas con prompts y clips para 10-60 minutos.</div>
      <div className="card">
        <div className="frow">
          <div className="fi" style={{flex:3}}><label className="lbl">Tema</label><input className="inp" placeholder="La disciplina como camino espiritual..." value={topic} onChange={e=>setTopic(e.target.value)}/></div>
          <div className="fi"><label className="lbl">Duración</label><select className="inp" value={duration} onChange={e=>setDuration(e.target.value)}>
            <option value="10">10 min</option>
            <option value="15">15 min</option>
            <option value="20">20 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
          </select></div>
          <div className="fi"><label className="lbl">Idioma</label><select className="inp" value={lang} onChange={e=>setLang(e.target.value)}>{LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
          <div className="fi"><label className="lbl">Estilo</label><select className="inp" value={style} onChange={e=>setStyle(e.target.value)}>{STYLES.map(s=><option key={s.code} value={s.code}>{s.label}</option>)}</select></div>
          <button className="btn bp" onClick={generate} disabled={loading||!topic.trim()} style={{alignSelf:"flex-end"}}>{loading?"⏳":"📽️ Generar"}</button>
        </div>
      </div>
      {error&&<div className="alert aerr">⚠️ {error}</div>}
      {loading&&<div className="loader"><div className="spin"/><span>Generando estructura completa...</span></div>}
      {script&&<>
        <div className="card" style={{borderColor:C.acc}}>
          <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>{script.titulo}</div>
          <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:12}}>{script.descripcion}</div>
          <div className="kwr">{script.palabras_clave?.map(kw=><span key={kw} className="tag ta">{kw}</span>)}</div>
          <div style={{marginTop:12,display:"flex",gap:10}}><span className="tag tg">⏱ {script.duracion_total}</span><span className="tag tok">{script.escenas?.length} bloques</span></div>
        </div>
        {script.escenas?.map(e=>(
          <div key={e.numero} className="sc">
            <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setOpen(open===e.numero?null:e.numero)}>
              <div className="sn" style={{background:sc[e.tipo]||C.acc}}>{e.numero}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:sc[e.tipo]||C.acc,textTransform:"uppercase"}}>{e.tipo}</div>
                <div style={{fontSize:14,fontWeight:600}}>{e.titulo_bloque}</div>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}><span className="tag">{e.duracion}</span><span style={{color:C.muted}}>{open===e.numero?"▲":"▼"}</span></div>
            </div>
            {open===e.numero&&<>
              <div style={{marginTop:12}}><span className="lbl">Guion</span><div className="stxt">{e.guion}</div><div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><CopyBtn text={e.guion}/></div></div>
              <span className="lbl">Prompt Veo3 / Runway / Sora</span>
              <div className="pbox">{e.prompt_video}</div>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><CopyBtn text={e.prompt_video}/></div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span className="lbl" style={{marginBottom:0}}>Clips — {e.busqueda_clip}</span>
                <button className="btn bs" style={{fontSize:12,padding:"5px 12px"}} onClick={()=>fetchClips(e)} disabled={loadClips[e.numero]}>{loadClips[e.numero]?"Buscando...":"🎬 Buscar clips"}</button>
              </div>
              {clips[e.numero]&&<div className="cgrid">
                {clips[e.numero].px?.slice(0,3).map(v=><div key={v.id} className="ci"><video src={v.video_files?.[0]?.link} muted loop onMouseOver={el=>el.target.play()} onMouseOut={el=>el.target.pause()}/><span className="csrc">Pexels</span></div>)}
                {clips[e.numero].pb?.slice(0,3).map(v=><div key={v.id} className="ci"><video src={v.videos?.small?.url} muted loop onMouseOver={el=>el.target.play()} onMouseOut={el=>el.target.pause()}/><span className="csrc">Pixabay</span></div>)}
              </div>}
            </>}
          </div>
        ))}
        <div className="card">
          <span className="lbl">Guion completo</span>
          <div className="stxt" style={{marginTop:8}}>{script.escenas?.map(e=>`[${e.tipo} — ${e.titulo_bloque}]\n${e.guion}`).join("\n\n─────────────────────\n\n")}</div>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}><CopyBtn text={script.escenas?.map(e=>`[${e.tipo} — ${e.titulo_bloque}]\n${e.guion}`).join("\n\n")}/></div>
        </div>
      </>}
    </div>
  );
}

export default function App(){
  const [config,setConfig]=useState(null);
  const [page,setPage]=useState("config");
  useEffect(()=>{
    const s=loadConfig();
    if(s?.youtubeKey&&s?.anthropicKey){setConfig(s);setPage("research");}
  },[]);
  const handleConfig=cfg=>{setConfig(cfg);if(cfg.youtubeKey&&cfg.anthropicKey)setPage("research");};
  const configured=!!(config?.youtubeKey&&config?.anthropicKey);
  const pages={config:<ConfigPage config={config} setConfig={handleConfig}/>,research:<ResearchPage config={config}/>,analyzer:<AnalyzerPage config={config}/>,shorts:<ShortsPage config={config}/>,longform:<LongFormPage config={config}/>};
  return(<><style>{css}</style><div className="app"><Sidebar page={page} setPage={setPage} configured={configured}/><div className="main">{pages[page]}</div></div></>);
      }
