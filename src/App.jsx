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
  const data = await res.json();
  return data.items || [];
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
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error("Error con la API de Anthropic.");
  return (await res.json()).content?.[0]?.text || "";
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
body{background:${C.bg};color:${C.txt};font-family:'Inter',sans-serif;min-height:100vh;}
.app{display:flex;min-height:100vh;}
.sidebar{width:220px;min-height:100vh;background:${C.surf};border-right:1px solid ${C.bord};display:flex;flex-direction:column;padding:24px 0;position:fixed;top:0;left:0;z-index:100;}
.slogo{padding:0 20px 28px;border-bottom:1px solid ${C.bord};margin-bottom:16px;}
.ltxt{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;letter-spacing:-0.5px;}
.lacc{color:${C.acc};}
.lsub{font-size:11px;color:${C.muted};margin-top:2px;letter-spacing:0.5px;}
.nitem{display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;font-size:13.5px;font-weight:500;color:${C.muted};transition:all 0.15s;border-left:3px solid transparent;margin:1px 0;}
.nitem:hover,.nitem.active{background:${C.accS};color:${C.txt};border-left-color:${C.acc};}
.main{margin-left:220px;flex:1;padding:32px 36px;min-height:100vh;}
.ptitle{font-family:'Syne',sans-serif;font-size:26px;font-weight:700;letter-spacing:-0.5px;margin-bottom:4px;}
.psub{color:${C.muted};font-size:14px;margin-bottom:28px;}
.card{background:${C.card};border:1px solid ${C.bord};border-radius:12px;padding:20px;margin-bottom:16px;transition:border-color 0.2s;}
.card:hover{border-color:${C.acc};}
.lbl{font-size:12px;font-weight:600;color:${C.muted};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;display:block;}
.inp{width:100%;background:${C.surf};border:1px solid ${C.bord};border-radius:8px;padding:10px 14px;color:${C.txt};font-size:14px;font-family:'Inter',sans-serif;outline:none;transition:border-color 0.15s;}
.inp:focus{border-color:${C.acc};}
.inp::placeholder{color:${C.dim};}
.btn{padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all 0.15s;font-family:'Inter',sans-serif;display:inline-flex;align-items:center;gap:8px;}
.bp{background:${C.acc};color:white;}.bp:hover{background:${C.accH};}.bp:disabled{opacity:0.4;cursor:not-allowed;}
.bs{background:${C.tag};color:${C.txt};border:1px solid ${C.bord};}.bs:hover{border-color:${C.acc};}
.bg{background:${C.gold};color:#0a0a0f;}.bg:hover{background:#f5c842;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;}
.tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${C.tag};color:${C.muted};border:1px solid ${C.bord};}
.ta{background:${C.accS};color:${C.acc};border-color:${C.acc}44;}
.tg{background:${C.goldS};color:${C.gold};border-color:${C.gold}44;}
.tok{background:#22c55e22;color:${C.ok};border-color:#22c55e44;}
.srow{display:flex;gap:20px;flex-wrap:wrap;margin:10px 0;}
.sc{background:${C.surf};border:1px solid ${C.bord};border-radius:10px;padding:16px;margin-bottom:12px;}
.sh{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.sn{width:28px;height:28px;background:${C.acc};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0;}
.stxt{background:${C.bg};border-radius:8px;padding:12px;font-size:14px;line-height:1.6;color:${C.txt};margin-bottom:10px;white-space:pre-wrap;}
.pbox{background:#0d1117;border:1px dashed ${C.bord};border-radius:8px;padding:10px 12px;font-size:12px;color:${C.muted};font-family:monospace;line-height:1.5;margin-bottom:8px;}
.alert{padding:12px 16px;border-radius:8px;font-size:13px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px;}
.aerr{background:#ef444420;border:1px solid #ef444444;color:#fca5a5;}
.aok{background:#22c55e20;border:1px solid #22c55e44;color:#86efac;}
.ainf{background:${C.accS};border:1px solid ${C.acc}44;color:#a78bfa;}
.loader{display:flex;flex-direction:column;align-items:center;gap:16px;padding:48px;color:${C.muted};font-size:14px;}
.spin{width:36px;height:36px;border:3px solid ${C.bord};border-top-color:${C.acc};border-radius:50%;animation:spin 0.8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.vc{background:${C.card};border:1px solid ${C.bord};border-radius:10px;overflow:hidden;cursor:pointer;transition:all 0.2s;}
.vc:hover{border-color:${C.acc};transform:translateY(-2px);}
.vt{position:relative;aspect-ratio:16/9;background:${C.surf};overflow:hidden;}
.vt img{width:100%;height:100%;object-fit:cover;}
.vd{position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.85);color:white;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;}
.ob{position:absolute;top:6px;left:6px;background:${C.gold};color:#0a0a0f;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;}
.vi{padding:12px;}
.vtit{font-size:13px;font-weight:500;line-height:1.4;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.frow{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:flex-end;}
.fi{display:flex;flex-direction:column;min-width:140px;}
.kwr{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.kw{padding:4px 12px;border-radius:20px;font-size:12px;background:${C.accS};color:${C.acc};border:1px solid ${C.acc}33;cursor:pointer;}
.kw:hover,.kw.sel{background:${C.acc};color:white;}
.cgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;}
.ci{border-radius:6px;overflow:hidden;aspect-ratio:9/16;background:${C.surf};position:relative;}
.ci video{width:100%;height:100%;object-fit:cover;}
.csrc{position:absolute;bottom:4px;right:4px;font-size:9px;background:rgba(0,0,0,0.7);color:white;padding:1px 5px;border-radius:3px;}
.cbtn{background:transparent;border:1px solid ${C.bord};color:${C.muted};font-size:11px;padding:3px 8px;border-radius:5px;cursor:pointer;}
.cbtn:hover{border-color:${C.acc};color:${C.acc};}
.tabs{display:flex;gap:4px;margin-bottom:20px;background:${C.surf};padding:4px;border-radius:10px;}
.tab{flex:1;padding:8px;text-align:center;border-radius:7px;cursor:pointer;font-size:13px;font-weight:500;color:${C.muted};transition:all 0.15s;border:none;background:transparent;font-family:'Inter',sans-serif;}
.tab.active{background:${C.acc};color:white;}
.div{height:1px;background:${C.bord};margin:20px 0;}
@media(max-width:768px){.sidebar{width:60px;}.slogo .ltxt,.slogo .lsub,.nitem span{display:none;}.main{margin-left:60px;padding:20px 16px;}.g2,.g3{grid-template-columns:1fr;}.frow{flex-direction:column;}}
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
      const items=await searchYouTube(q,config,{duration:filters.duration,language:filters.language});
      if(!items.length){setError("No se encontraron videos.");setLoading(false);return;}
      const ids=items.map(i=>i.id?.videoId).filter(Boolean);
      const chIds=[...new Set(items.map(i=>i.snippet?.channelId).filter(Boolean))];
      const[stats,channels]=await Promise.all([getVideoStats(ids,config),getChannelStats(chIds,config)]);
      const chMap={};channels.forEach(c=>{chMap[c.id]=parseInt(c.statistics?.subscriberCount||0);});
      const enriched=stats.map(v=>{
        const subs=chMap[v.snippet?.channelId]||0;
        const views=parseInt(v.statistics?.viewCount||0);
        const dur=parseDuration(v.contentDetails?.duration);
        return{...v,subs,views,dur,score:outlierScore(views,subs)};
      }).filter(v=>!filters.maxSubs||v.subs<=parseInt(filters.maxSubs)).sort((a,b)=>b.score-a.score);
      setVideos(enriched);
    }catch(e){setError(e.message);}
    setLoading(false);
  };
  return(
    <div>
      <div className="ptitle">🔍 Investigar Nichos</div>
      <div className="psub">Encuentra videos outliers con alto potencial viral.</div>
      <div className="card">
        <div className="frow">
          <div className="fi" style={{flex:2}}><label className="lbl">Búsqueda</label><input className="inp" placeholder="spiritual awakening..." value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()}/></div>
          <div className="fi"><label className="lbl">Duración</label><select className="inp" value={filters.duration} onChange={e=>setFilters(p=>({...p,duration:e.target.value}))}><option value="any">Todos</option><option value="short">Shorts</option><option value="medium">Medianos</option><option value="long">Largos</option></select></div>
          <div className="fi"><label className="lbl">Idioma</label><select className="inp" value={filters.language} onChange={e=>setFilters(p=>({...p,language:e.target.value}))}><option value="en">Inglés</option><option value="es">Español</option></select></div>
          <div className="fi"><label className="lbl">Máx subs</label><input className="inp" type="number" value={filters.maxSubs} onChange={e=>setFilters(p=>({...p,maxSubs:e.target.value}))}/></div>
          <button className="btn bp" onClick={()=>search()} disabled={loading||!query.trim()}>{loading?"⏳":"Buscar"}</button>
        </div>
        <div style={{borderTop:`1px solid ${C.bord}`,paddingTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span className="lbl" style={{marginBottom:0}}>Keywords IA</span>
            <button className="btn bs" style={{fontSize:12,padding:"5px 12px"}} onClick={genKw} disabled={loadKw}>{loadKw?"Generando...":"✨ Generar"}</button>
          </div>
          <div className="kwr">{(aiKw.length?aiKw:defKw).map(kw=><span key={kw} className={`kw${query===kw?" sel":""}`} onClick={()=>{setQuery(kw);search(kw);}}>{kw}</span>)}</div>
        </div>
      </div>
      {error&&<div className="alert aerr">⚠️ {error}</div>}
      {loading&&<div className="loader"><div className="spin"/><span>Buscando joyas virales...</span></div>}
      {videos.length>0&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span style={{fontSize:13,color:C.muted}}>{videos.length} videos encontrados</span>
          <span className="tag tg">🔥 Top outliers primero</span>
        </div>
        <div className="g3">{videos.map(v=>{
          const thumb=v.snippet?.thumbnails?.medium?.url;
          const score=parseFloat(v.score);
          return(
            <div key={v.id} className="vc" onClick={()=>window.open(`https://youtube.com/watch?v=${v.id}`,'_blank')}>
              <div className="vt">{thumb&&<img src={thumb} alt=""/>}<span className="vd">{formatDuration(v.dur)}</span>{score>5&&<span className="ob">🔥 {score}x</span>}</div>
              <div className="vi">
                <div className="vtit">{v.snippet?.title}</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:8}}>{v.snippet?.channelTitle} · {formatNumber(v.subs)} subs</div>
                <div className="srow">
                  <div><div style={{fontSize:18,fontWeight:700}}>{formatNumber(v.views)}</div><div style={{fontSize:11,color:C.muted}}>vistas</div></div>
                  <div><div style={{fontSize:18,fontWeight:700,color:score>10?C.gold:C.acc}}>{score}x</div><div style={{fontSize:11,color:C.muted}}>outlier</div></div>
                </div>
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <button className="btn bs" style={{fontSize:11,padding:"4px 10px",flex:1}} onClick={e=>{e.stopPropagation();window.open(`https://youtube.com/watch?v=${v.id}`,'_blank');}}>▶ Ver</button>
                  <button className="btn bp" style={{fontSize:11,padding:"4px 10px",flex:2}} onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(`https://youtube.com/watch?v=${v.id}`);alert('URL copiada — pégala en Analizar Video');}}>🎯 Copiar URL</button>
                </div>
              </div>
            </div>
          );
        })}</div>
      </>}
    </div>
  );
}

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
      const prompt=`Analiza este video viral y genera 3 ideas adaptadas.\nVIDEO: "${v.snippet?.title}"\nDESCRIPCIÓN: ${v.snippet?.description?.slice(0,400)||""}\n\nResponde SOLO en JSON:\n{"estructura":{"hook":"...","desarrollo":"...","cierre":"..."},"ideas":[{"titulo":"...","hook":"...","estructura":"...","miniatura":"...","palabrasClave":["kw1","kw2"]}]}\n\n3 ideas en ${langLabel}, estilo ${styleLabel}, canal faceless. Solo JSON.`;
      const text=await callClaude(prompt,config);
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
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
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [script,setScript]=useState(null);
  const [clips,setClips]=useState({});
  const [loadClips,setLoadClips]=useState({});
  const generate=async()=>{
    if(!topic.trim())return;
    setLoading(true);setError("");setScript(null);setClips({});
    try{
      const lL=LANGUAGES.find(l=>l.code===lang)?.label||"español neutro";
      const sL=STYLES.find(s=>s.code===style)?.label||"reflexivo";
      const prompt=`Crea un YouTube Short completo sobre: "${topic}"\nIdioma: ${lL}\nEstilo: ${sL}\nSin emojis, sin listas, lenguaje simple para voz IA, sin marca personal.\n\nResponde SOLO en JSON:\n{"titulo":"...","duracion_total":"55-60 segundos","escenas":[{"numero":1,"tipo":"HOOK","duracion":"3 segundos","guion":"...","prompt_video":"prompt en inglés para Veo3/Runway","busqueda_clip":"keyword inglés"},{"numero":2,"tipo":"DESARROLLO","duracion":"45 segundos","guion":"...","prompt_video":"...","busqueda_clip":"..."},{"numero":3,"tipo":"CIERRE","duracion":"10 segundos","guion":"pregunta reflexiva","prompt_video":"...","busqueda_clip":"..."}]}\nSolo JSON.`;
      const text=await callClaude(prompt,config);
      setScript(JSON.parse(text.replace(/```json|```/g,"").trim()));
    }catch{setError("Error generando. Verifica tu Anthropic API key.");}
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
  const sc={HOOK:C.gold,DESARROLLO:C.acc,CIERRE:C.ok};
  return(
    <div>
      <div className="ptitle">⚡ Generar Short</div>
      <div className="psub">Script completo con prompts y clips para cada escena.</div>
      <div className="card">
        <div className="frow">
          <div className="fi" style={{flex:3}}><label className="lbl">Tema</label><input className="inp" placeholder="El silencio que transforma..." value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()}/></div>
          <div className="fi"><label className="lbl">Idioma</label><select className="inp" value={lang} onChange={e=>setLang(e.target.value)}>{LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
          <div className="fi"><label className="lbl">Estilo</label><select className="inp" value={style} onChange={e=>setStyle(e.target.value)}>{STYLES.map(s=><option key={s.code} value={s.code}>{s.label}</option>)}</select></div>
          <button className="btn bg" onClick={generate} disabled={loading||!topic.trim()}>{loading?"⏳":"⚡ Generar"}</button>
        </div>
      </div>
      {error&&<div className="alert aerr">⚠️ {error}</div>}
      {loading&&<div className="loader"><div className="spin"/><span>Generando tu Short...</span></div>}
      {script&&<>
        <div className="card" style={{borderColor:C.gold}}>
          <div style={{fontSize:17,fontWeight:700}}>{script.titulo}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:4}}>⏱ {script.duracion_total}</div>
        </div>
        {script.escenas?.map(e=>(
          <div key={e.numero} className="sc">
            <div className="sh">
              <div className="sn" style={{background:sc[e.tipo]||C.acc}}>{e.numero}</div>
              <div><div style={{fontSize:11,fontWeight:700,color:sc[e.tipo]||C.acc,textTransform:"uppercase"}}>{e.tipo}</div><div style={{fontSize:11,color:C.muted}}>{e.duracion}</div></div>
            </div>
            <span className="lbl">Guion</span>
            <div className="stxt">{e.guion}</div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}><CopyBtn text={e.guion}/></div>
            <span className="lbl">Prompt Veo3 / Runway / Sora</span>
            <div className="pbox">{e.prompt_video}</div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}><CopyBtn text={e.prompt_video}/></div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span className="lbl" style={{marginBottom:0}}>Clips — {e.busqueda_clip}</span>
              <button className="btn bs" style={{fontSize:12,padding:"5px 12px"}} onClick={()=>fetchClips(e)} disabled={loadClips[e.numero]}>{loadClips[e.numero]?"Buscando...":"🎬 Buscar clips"}</button>
            </div>
            {clips[e.numero]&&<div className="cgrid">
              {clips[e.numero].px?.slice(0,3).map(v=><div key={v.id} className="ci"><video src={v.video_files?.[0]?.link} muted loop onMouseOver={el=>el.target.play()} onMouseOut={el=>el.target.pause()}/><span className="csrc">Pexels</span></div>)}
              {clips[e.numero].pb?.slice(0,3).map(v=><div key={v.id} className="ci"><video src={v.videos?.small?.url} muted loop onMouseOver={el=>el.target.play()} onMouseOut={el=>el.target.pause()}/><span className="csrc">Pixabay</span></div>)}
            </div>}
          </div>
        ))}
        <div className="card">
          <span className="lbl">Script completo</span>
          <div className="stxt" style={{marginTop:8}}>{script.escenas?.map(e=>`[${e.tipo} - ${e.duracion}]\n${e.guion}`).join("\n\n")}</div>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}><CopyBtn text={script.escenas?.map(e=>`[${e.tipo}]\n${e.guion}`).join("\n\n")}/></div>
        </div>
      </>}
    </div>
  );
}

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
      const n=duration==="60"?8:duration==="45"?6:5;
      const prompt=`Crea estructura completa de video de ${duration} minutos sobre: "${topic}"\nIdioma: ${lL}, Estilo: ${sL}, ${n} escenas, canal faceless, sin emojis.\n\nResponde SOLO en JSON:\n{"titulo":"...","descripcion":"150 palabras para YouTube","duracion_total":"${duration} minutos","palabras_clave":["kw1","kw2","kw3","kw4","kw5"],"escenas":[{"numero":1,"tipo":"INTRO","titulo_bloque":"...","duracion":"X min","guion":"mínimo 150 palabras","prompt_video":"prompt inglés detallado","busqueda_clip":"keyword inglés"}]}\nTipos: INTRO, DESARROLLO (x${n-2}), CIERRE. Solo JSON.`;
      const text=await callClaude(prompt,config);
      setScript(JSON.parse(text.replace(/```json|```/g,"").trim()));
      setOpen(1);
    }catch{setError("Error generando. Verifica tu Anthropic API key.");}
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
      <div className="psub">Script por escenas con prompts y clips para 30-60 minutos.</div>
      <div className="card">
        <div className="frow">
          <div className="fi" style={{flex:3}}><label className="lbl">Tema</label><input className="inp" placeholder="La disciplina como camino espiritual..." value={topic} onChange={e=>setTopic(e.target.value)}/></div>
          <div className="fi"><label className="lbl">Duración</label><select className="inp" value={duration} onChange={e=>setDuration(e.target.value)}><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option></select></div>
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
