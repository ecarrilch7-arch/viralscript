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
  const res = await fetch("https://www.googleapis.com/youtube/v3/search?" + params);
  if (!res.ok) throw new Error("Error con la API de YouTube.");
  return (await res.json()).items || [];
}
async function getVideoStats(videoIds, config) {
  const res = await fetch("https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=" + videoIds.join(",") + "&key=" + config.youtubeKey);
  if (!res.ok) throw new Error("Error obteniendo estadísticas.");
  return (await res.json()).items || [];
}
async function getChannelStats(channelIds, config) {
  const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=statistics&id=" + channelIds.join(",") + "&key=" + config.youtubeKey);
  if (!res.ok) throw new Error("Error obteniendo datos del canal.");
  return (await res.json()).items || [];
}
async function searchPexels(query, config) {
  const res = await fetch("https://api.pexels.com/videos/search?query=" + encodeURIComponent(query) + "&per_page=6&orientation=portrait", { headers: { Authorization: config.pexelsKey } });
  if (!res.ok) return [];
  return (await res.json()).videos || [];
}
async function searchPixabay(query, config) {
  const res = await fetch("https://pixabay.com/api/videos/?key=" + config.pixabayKey + "&q=" + encodeURIComponent(query) + "&per_page=6");
  if (!res.ok) return [];
  return (await res.json()).hits || [];
}
async function callClaude(prompt, config) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: config.anthropicKey, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error("Error con la API de Anthropic.");
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

function parseDuration(iso) {
  const m = iso && iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1]||0)*3600)+(parseInt(m[2]||0)*60)+(parseInt(m[3]||0));
}
function formatDuration(s) {
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;
  return h>0?h+"h "+m+"m":m+"m "+sc+"s";
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

const css = "@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');"
+ "html{width:100%;overflow-x:hidden;}"
+ "*{box-sizing:border-box;margin:0;padding:0;}"
+ "body{background:#0a0a0f;color:#e8e8f0;font-family:'Inter',sans-serif;min-height:100vh;width:100%;overflow-x:hidden;}"
+ ".app{display:flex;min-height:100vh;width:100%;overflow-x:hidden;}"
+ ".sidebar{width:220px;min-height:100vh;background:#111118;border-right:1px solid #222230;display:flex;flex-direction:column;padding:24px 0;position:fixed;top:0;left:0;z-index:100;}"
+ ".slogo{padding:0 20px 28px;border-bottom:1px solid #222230;margin-bottom:16px;}"
+ ".ltxt{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;letter-spacing:-0.5px;}"
+ ".lacc{color:#6c3fff;}"
+ ".lsub{font-size:11px;color:#7878a0;margin-top:2px;letter-spacing:0.5px;}"
+ ".nitem{display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;font-size:13.5px;font-weight:500;color:#7878a0;transition:all 0.15s;border-left:3px solid transparent;margin:1px 0;}"
+ ".nitem:hover,.nitem.active{background:#6c3fff22;color:#e8e8f0;border-left-color:#6c3fff;}"
+ ".main{margin-left:220px;flex:1;padding:32px 36px;min-height:100vh;}"
+ ".ptitle{font-family:'Syne',sans-serif;font-size:26px;font-weight:700;letter-spacing:-0.5px;margin-bottom:4px;}"
+ ".psub{color:#7878a0;font-size:14px;margin-bottom:28px;}"
+ ".card{background:#16161f;border:1px solid #222230;border-radius:12px;padding:20px;margin-bottom:16px;transition:border-color 0.2s;}"
+ ".card:hover{border-color:#6c3fff;}"
+ ".lbl{font-size:12px;font-weight:600;color:#7878a0;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;display:block;}"
+ ".inp{width:100%;background:#111118;border:1px solid #222230;border-radius:8px;padding:10px 14px;color:#e8e8f0;font-size:14px;font-family:'Inter',sans-serif;outline:none;transition:border-color 0.15s;}"
+ ".inp:focus{border-color:#6c3fff;}"
+ ".inp::placeholder{color:#4a4a6a;}"
+ ".btn{padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all 0.15s;font-family:'Inter',sans-serif;display:inline-flex;align-items:center;gap:8px;}"
+ ".bp{background:#6c3fff;color:white;}.bp:hover{background:#8b5fff;}.bp:disabled{opacity:0.4;cursor:not-allowed;}"
+ ".bs{background:#1e1e2e;color:#e8e8f0;border:1px solid #222230;}.bs:hover{border-color:#6c3fff;}"
+ ".bg{background:#f0b429;color:#0a0a0f;}.bg:hover{background:#f5c842;}"
+ ".g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}"
+ ".g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;}"
+ ".tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#1e1e2e;color:#7878a0;border:1px solid #222230;}"
+ ".ta{background:#6c3fff22;color:#6c3fff;border-color:#6c3fff44;}"
+ ".tg{background:#f0b42922;color:#f0b429;border-color:#f0b42944;}"
+ ".tok{background:#22c55e22;color:#22c55e;border-color:#22c55e44;}"
+ ".srow{display:flex;gap:20px;flex-wrap:wrap;margin:10px 0;}"
+ ".sc{background:#111118;border:1px solid #222230;border-radius:10px;padding:16px;margin-bottom:12px;}"
+ ".sh{display:flex;align-items:center;gap:10px;margin-bottom:12px;}"
+ ".sn{width:28px;height:28px;background:#6c3fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0;}"
+ ".stxt{background:#0a0a0f;border-radius:8px;padding:12px;font-size:14px;line-height:1.6;color:#e8e8f0;margin-bottom:10px;white-space:pre-wrap;}"
+ ".pbox{background:#0d1117;border:1px dashed #222230;border-radius:8px;padding:10px 12px;font-size:12px;color:#7878a0;font-family:monospace;line-height:1.5;margin-bottom:8px;}"
+ ".alert{padding:12px 16px;border-radius:8px;font-size:13px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px;}"
+ ".aerr{background:#ef444420;border:1px solid #ef444444;color:#fca5a5;}"
+ ".aok{background:#22c55e20;border:1px solid #22c55e44;color:#86efac;}"
+ ".ainf{background:#6c3fff22;border:1px solid #6c3fff44;color:#a78bfa;}"
+ ".loader{display:flex;flex-direction:column;align-items:center;gap:16px;padding:48px;color:#7878a0;font-size:14px;}"
+ ".spin{width:36px;height:36px;border:3px solid #222230;border-top-color:#6c3fff;border-radius:50%;animation:spin 0.8s linear infinite;}"
+ "@keyframes spin{to{transform:rotate(360deg);}}"
+ ".vc{background:#16161f;border:1px solid #222230;border-radius:10px;overflow:hidden;cursor:pointer;transition:all 0.2s;}"
+ ".vc:hover{border-color:#6c3fff;transform:translateY(-2px);}"
+ ".vt{position:relative;aspect-ratio:16/9;background:#111118;overflow:hidden;}"
+ ".vt img{width:100%;height:100%;object-fit:cover;}"
+ ".vd{position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.85);color:white;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;}"
+ ".ob{position:absolute;top:6px;left:6px;background:#f0b429;color:#0a0a0f;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;}"
+ ".vi{padding:12px;}"
+ ".vtit{font-size:13px;font-weight:500;line-height:1.4;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}"
+ ".frow{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:flex-end;}"
+ ".fi{display:flex;flex-direction:column;min-width:140px;}"
+ ".kwr{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}"
+ ".kw{padding:4px 12px;border-radius:20px;font-size:12px;background:#6c3fff22;color:#6c3fff;border:1px solid #6c3fff33;cursor:pointer;}"
+ ".kw:hover,.kw.sel{background:#6c3fff;color:white;}"
+ ".cgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;}"
+ ".ci{border-radius:6px;overflow:hidden;aspect-ratio:9/16;background:#111118;position:relative;}"
+ ".ci video{width:100%;height:100%;object-fit:cover;}"
+ ".csrc{position:absolute;bottom:4px;right:4px;font-size:9px;background:rgba(0,0,0,0.7);color:white;padding:1px 5px;border-radius:3px;}"
+ ".cbtn{background:transparent;border:1px solid #222230;color:#7878a0;font-size:11px;padding:3px 8px;border-radius:5px;cursor:pointer;}"
+ ".cbtn:hover{border-color:#6c3fff;color:#6c3fff;}"
+ ".div{height:1px;background:#222230;margin:20px 0;}"
+ "@media(max-width:900px){.sidebar{width:56px;}.slogo .ltxt,.slogo .lsub,.nitem span{display:none;}.nitem{justify-content:center;padding:12px 0;}.main{margin-left:56px;padding:16px 14px;width:calc(100% - 56px);}.g2,.g3{grid-template-columns:1fr;}.frow{flex-direction:column;align-items:stretch;}.fi{min-width:100%;}.ptitle{font-size:20px;}.cgrid{grid-template-columns:repeat(2,1fr);}}";

function CopyBtn(props){
  const text = props.text;
  const [c,setC]=useState(false);
  return <button className="cbtn" onClick={function(){navigator.clipboard.writeText(text);setC(true);setTimeout(function(){setC(false);},1500);}}>{c?"✓ Copiado":"Copiar"}</button>;
}

function Sidebar(props){
  const page = props.page, setPage = props.setPage, configured = props.configured;
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
      {nav.map(function(n){
        return <div key={n.id} className={"nitem" + (page===n.id?" active":"")}
          style={{opacity:n.req&&!configured?0.35:1,cursor:n.req&&!configured?"not-allowed":"pointer"}}
          onClick={function(){if(!n.req||configured)setPage(n.id);}}>
          <span>{n.icon}</span><span>{n.label}</span>
        </div>;
      })}
    </div>
  );
                               }
function ConfigPage(props){
  const config = props.config, setConfig = props.setConfig;
  const [form,setForm]=useState(config||{youtubeKey:"",pexelsKey:"",pixabayKey:"",anthropicKey:"",language:"es-latam",style:"reflexivo",channelName:"",niche:""});
  const [saved,setSaved]=useState(false);
  const save=function(){saveConfig(form);setConfig(form);setSaved(true);setTimeout(function(){setSaved(false);},2000);};
  const f=function(k){return function(e){setForm(function(p){const np=Object.assign({},p);np[k]=e.target.value;return np;});};};
  const ok=form.youtubeKey&&form.pexelsKey&&form.anthropicKey;
  return(
    <div>
      <div className="ptitle">Configuración</div>
      <div className="psub">Completa estos datos una sola vez.</div>
      {saved&&<div className="alert aok">✓ Guardado correctamente.</div>}
      <div className="card">
        <div style={{fontSize:15,fontWeight:700,marginBottom:14,paddingBottom:10,borderBottom:"1px solid #222230"}}>🔑 API Keys</div>
        {[{k:"youtubeKey",l:"YouTube Data API Key",p:"AIza..."},{k:"pexelsKey",l:"Pexels API Key",p:"Tu clave Pexels"},{k:"pixabayKey",l:"Pixabay API Key (opcional)",p:"Tu clave Pixabay"},{k:"anthropicKey",l:"Anthropic API Key",p:"sk-ant-..."}].map(function(item){
          return <div key={item.k} style={{marginBottom:14}}>
            <label className="lbl">{item.l}</label>
            <input className="inp" type="password" placeholder={item.p} value={form[item.k]||""} onChange={f(item.k)}/>
          </div>;
        })}
      </div>
      <div className="card">
        <div style={{fontSize:15,fontWeight:700,marginBottom:14,paddingBottom:10,borderBottom:"1px solid #222230"}}>🎙️ Preferencias</div>
        <div className="g2">
          <div><label className="lbl">Idioma</label><select className="inp" value={form.language} onChange={f("language")}>{LANGUAGES.map(function(l){return <option key={l.code} value={l.code}>{l.label}</option>;})}</select></div>
          <div><label className="lbl">Estilo</label><select className="inp" value={form.style} onChange={f("style")}>{STYLES.map(function(s){return <option key={s.code} value={s.code}>{s.label}</option>;})}</select></div>
          <div><label className="lbl">Nombre del canal</label><input className="inp" placeholder="Mi canal..." value={form.channelName||""} onChange={f("channelName")}/></div>
          <div><label className="lbl">Nicho principal</label><input className="inp" placeholder="Espiritualidad..." value={form.niche||""} onChange={f("niche")}/></div>
        </div>
      </div>
      <button className="btn bp" onClick={save} disabled={!ok} style={{width:"100%",justifyContent:"center",padding:14}}>{ok?"💾 Guardar configuración":"Completa las API keys para continuar"}</button>
    </div>
  );
}

function ResearchPage(props){
  const config = props.config;
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [videos,setVideos]=useState([]);
  const [filters,setFilters]=useState({duration:"long",language:"en",maxSubs:100000});
  const [aiKw,setAiKw]=useState([]);
  const [loadKw,setLoadKw]=useState(false);
  const defKw=["spiritual awakening","personal growth","mindfulness meditation","law of attraction","stoicism","self discipline","inner peace","healing prayer","faith and anxiety","consciousness"];
  const genKw=async function(){
    setLoadKw(true);
    try{
      const p="Genera 8 keywords en ingles para buscar videos virales de YouTube en el nicho de "+JSON.stringify(config.niche||"desarrollo personal")+". Canales faceless, videos largos. Responde SOLO con JSON array de strings.";
      const t=await callClaude(p,config);
      setAiKw(JSON.parse(t.replace(/```json|```/g,"").trim()));
    }catch(err){setAiKw(defKw.slice(0,8));}
    setLoadKw(false);
  };
  const search=async function(kw){
    const q=kw||query;if(!q.trim())return;
    setLoading(true);setError("");setVideos([]);
    try{
      const items=await searchYouTube(q,config,{duration:filters.duration,language:filters.language});
      if(!items.length){setError("No se encontraron videos.");setLoading(false);return;}
      const ids=items.map(function(i){return i.id?i.id.videoId:null;}).filter(Boolean);
      const chIds=Array.from(new Set(items.map(function(i){return i.snippet?i.snippet.channelId:null;}).filter(Boolean)));
      const results=await Promise.all([getVideoStats(ids,config),getChannelStats(chIds,config)]);
      const stats=results[0],channels=results[1];
      const chMap={};
      channels.forEach(function(c){chMap[c.id]=parseInt((c.statistics&&c.statistics.subscriberCount)||0);});
      const enriched=stats.map(function(v){
        const subs=chMap[v.snippet?v.snippet.channelId:null]||0;
        const views=parseInt((v.statistics&&v.statistics.viewCount)||0);
        const dur=parseDuration(v.contentDetails?v.contentDetails.duration:null);
        const copy=Object.assign({},v);
        copy.subs=subs;copy.views=views;copy.dur=dur;copy.score=outlierScore(views,subs);
        return copy;
      }).filter(function(v){return !filters.maxSubs||v.subs<=parseInt(filters.maxSubs);}).sort(function(a,b){return b.score-a.score;});
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
          <div className="fi" style={{flex:2}}><label className="lbl">Búsqueda</label><input className="inp" placeholder="spiritual awakening..." value={query} onChange={function(e){setQuery(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")search();}}/></div>
          <div className="fi"><label className="lbl">Duración</label><select className="inp" value={filters.duration} onChange={function(e){setFilters(function(p){return Object.assign({},p,{duration:e.target.value});});}}><option value="any">Todos</option><option value="short">Shorts</option><option value="medium">Medianos</option><option value="long">Largos</option></select></div>
          <div className="fi"><label className="lbl">Idioma</label><select className="inp" value={filters.language} onChange={function(e){setFilters(function(p){return Object.assign({},p,{language:e.target.value});});}}><option value="en">Inglés</option><option value="es">Español</option></select></div>
          <div className="fi"><label className="lbl">Máx subs</label><input className="inp" type="number" value={filters.maxSubs} onChange={function(e){setFilters(function(p){return Object.assign({},p,{maxSubs:e.target.value});});}}/></div>
          <button className="btn bp" onClick={function(){search();}} disabled={loading||!query.trim()}>{loading?"⏳":"Buscar"}</button>
        </div>
        <div style={{borderTop:"1px solid #222230",paddingTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span className="lbl" style={{marginBottom:0}}>Keywords IA</span>
            <button className="btn bs" style={{fontSize:12,padding:"5px 12px"}} onClick={genKw} disabled={loadKw}>{loadKw?"Generando...":"✨ Generar"}</button>
          </div>
          <div className="kwr">{(aiKw.length?aiKw:defKw).map(function(kw){return <span key={kw} className={"kw"+(query===kw?" sel":"")} onClick={function(){setQuery(kw);search(kw);}}>{kw}</span>;})}</div>
        </div>
      </div>
      {error&&<div className="alert aerr">⚠️ {error}</div>}
      {loading&&<div className="loader"><div className="spin"/><span>Buscando joyas virales...</span></div>}
      {videos.length>0&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span style={{fontSize:13,color:"#7878a0"}}>{videos.length} videos encontrados</span>
          <span className="tag tg">🔥 Top outliers primero</span>
        </div>
        <div className="g3">{videos.map(function(v){
          const thumb=v.snippet&&v.snippet.thumbnails&&v.snippet.thumbnails.medium?v.snippet.thumbnails.medium.url:null;
          const score=parseFloat(v.score);
          return(
            <div key={v.id} className="vc">
              <div className="vt" onClick={function(){window.open("https://youtube.com/watch?v="+v.id,"_blank");}}>{thumb&&<img src={thumb} alt=""/>}<span className="vd">{formatDuration(v.dur)}</span>{score>5&&<span className="ob">🔥 {score}x</span>}</div>
              <div className="vi">
                <div className="vtit">{v.snippet?v.snippet.title:""}</div>
                <div style={{fontSize:11,color:"#7878a0",marginBottom:8}}>{v.snippet?v.snippet.channelTitle:""} · {formatNumber(v.subs)} subs</div>
                <div className="srow">
                  <div><div style={{fontSize:18,fontWeight:700}}>{formatNumber(v.views)}</div><div style={{fontSize:11,color:"#7878a0"}}>vistas</div></div>
                  <div><div style={{fontSize:18,fontWeight:700,color:score>10?"#f0b429":"#6c3fff"}}>{score}x</div><div style={{fontSize:11,color:"#7878a0"}}>outlier</div></div>
                </div>
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <button className="btn bs" style={{fontSize:11,padding:"4px 10px",flex:1}} onClick={function(){window.open("https://youtube.com/watch?v="+v.id,"_blank");}}>▶ Ver</button>
                  <button className="btn bp" style={{fontSize:11,padding:"4px 10px",flex:2}} onClick={function(){navigator.clipboard.writeText("https://youtube.com/watch?v="+v.id);alert("URL copiada — pégala en Analizar Video");}}>🎯 Copiar URL</button>
                </div>
              </div>
            </div>
          );
        })}</div>
      </div>}
    </div>
  );
}
function AnalyzerPage(props){
  const config = props.config;
  const [url,setUrl]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState(null);
  const [lang,setLang]=useState(config.language);
  const analyze=async function(){
    const m=url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if(!m){setError("URL inválida.");return;}
    setLoading(true);setError("");setResult(null);
    try{
      const stats=await getVideoStats([m[1]],config);
      const v=stats[0];if(!v)throw new Error("Video no encontrado.");
      const langObj=LANGUAGES.find(function(l){return l.code===lang;});
      const langLabel=langObj?langObj.label:"español";
      const styleObj=STYLES.find(function(s){return s.code===config.style;});
      const styleLabel=styleObj?styleObj.label:"reflexivo";
      const desc=(v.snippet&&v.snippet.description)?v.snippet.description.slice(0,400):"";
      const prompt="Analiza este video viral y genera 3 ideas adaptadas.\nVIDEO: "+JSON.stringify(v.snippet?v.snippet.title:"")+"\nDESCRIPCION: "+desc+"\n\nResponde SOLO en JSON valido:\n{\"estructura\":{\"hook\":\"texto\",\"desarrollo\":\"texto\",\"cierre\":\"texto\"},\"ideas\":[{\"titulo\":\"texto\",\"hook\":\"texto\",\"estructura\":\"texto\",\"miniatura\":\"texto\",\"palabrasClave\":[\"kw1\",\"kw2\"]}]}\n\n3 ideas en "+langLabel+", estilo "+styleLabel+", canal faceless. Solo JSON sin markdown.";
      const text=await callClaude(prompt,config);
      const clean=text.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      setResult({video:v,parsed:parsed,views:formatNumber(parseInt((v.statistics&&v.statistics.viewCount)||0)),dur:formatDuration(parseDuration(v.contentDetails?v.contentDetails.duration:null))});
    }catch(e){setError(e.message);}
    setLoading(false);
  };
  return(
    <div>
      <div className="ptitle">🎯 Analizar Video</div>
      <div className="psub">Pega la URL de un video outlier y obtén su estructura + 3 ideas.</div>
      <div className="card">
        <div className="frow">
          <div className="fi" style={{flex:3}}><label className="lbl">URL del video</label><input className="inp" placeholder="https://youtube.com/watch?v=..." value={url} onChange={function(e){setUrl(e.target.value);}}/></div>
          <div className="fi"><label className="lbl">Idioma salida</label><select className="inp" value={lang} onChange={function(e){setLang(e.target.value);}}>{LANGUAGES.map(function(l){return <option key={l.code} value={l.code}>{l.label}</option>;})}</select></div>
          <button className="btn bp" onClick={analyze} disabled={loading||!url.trim()}>{loading?"⏳":"Analizar"}</button>
        </div>
      </div>
      {error&&<div className="alert aerr">⚠️ {error}</div>}
      {loading&&<div className="loader"><div className="spin"/><span>Analizando estructura...</span></div>}
      {result&&<div>
        <div className="card">
          <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>{result.video.snippet?result.video.snippet.title:""}</div>
          <div style={{fontSize:12,color:"#7878a0",marginBottom:14}}>{result.video.snippet?result.video.snippet.channelTitle:""} · {result.views} vistas · {result.dur}</div>
          {Object.keys(result.parsed.estructura).map(function(k){
            return <div key={k} style={{marginBottom:10}}><span className="tag ta" style={{marginBottom:5,display:"inline-block"}}>{k.toUpperCase()}</span><div style={{fontSize:13,marginTop:4,lineHeight:1.6}}>{result.parsed.estructura[k]}</div></div>;
          })}
        </div>
        <div style={{fontSize:17,fontWeight:700,margin:"20px 0 14px"}}>3 Ideas generadas</div>
        {result.parsed.ideas.map(function(idea,i){
          return <div key={i} className="card">
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div style={{fontSize:15,fontWeight:700}}>{idea.titulo}</div><span className="tag tg">Idea {i+1}</span></div>
            <div style={{marginBottom:8}}><span className="lbl">Hook</span><div style={{fontSize:13,marginTop:4}}>{idea.hook}</div></div>
            <div style={{marginBottom:8}}><span className="lbl">Estructura</span><div style={{fontSize:13,marginTop:4}}>{idea.estructura}</div></div>
            <div style={{marginBottom:8}}><span className="lbl">Miniatura</span><div style={{fontSize:13,marginTop:4}}>{idea.miniatura}</div></div>
            <div className="kwr">{idea.palabrasClave&&idea.palabrasClave.map(function(kw){return <span key={kw} className="tag ta">{kw}</span>;})}</div>
          </div>;
        })}
      </div>}
    </div>
  );
}
function ShortsPage(props){
  const config = props.config;
  const [mode,setMode]=useState("ai");
  const [topic,setTopic]=useState("");
  const [lang,setLang]=useState(config.language);
  const [style,setStyle]=useState(config.style);
  const [loading,setLoading]=useState(false);
  const [loadingStep,setLoadingStep]=useState("");
  const [error,setError]=useState("");
  const [script,setScript]=useState(null);
  const [clips,setClips]=useState({});
  const [loadClips,setLoadClips]=useState({});
  const [ownScript,setOwnScript]=useState("");
  const [ownAudioName,setOwnAudioName]=useState("");
  const [ownAudioUrl,setOwnAudioUrl]=useState("");

  const generate=async function(){
    if(!topic.trim())return;
    setLoading(true);setError("");setScript(null);setClips({});
    try{
      const lObj=LANGUAGES.find(function(l){return l.code===lang;});
      const lL=lObj?lObj.label:"español neutro";
      const sObj=STYLES.find(function(s){return s.code===style;});
      const sL=sObj?sObj.label:"reflexivo";

      setLoadingStep("Paso 1/4 — Generando ideas con gancho...");
      const p1="Genera 3 ideas de YouTube Short sobre "+JSON.stringify(topic)+" en "+lL+", estilo "+sL+". No quiero ideas genericas ni titulos tipo 'como mejorar en'. Cada idea debe basarse en un problema real y especifico que alguien ya esta viviendo, algo que genere identificacion inmediata tipo 'esto me pasa'. Responde SOLO JSON: {\"ideas\":[\"idea1\",\"idea2\",\"idea3\"]}. Sin markdown.";
      const r1=await callClaude(p1,config);
      const ideas=JSON.parse(r1.replace(/```json|```/g,"").trim());
      const ideaElegida=ideas.ideas&&ideas.ideas[0]?ideas.ideas[0]:topic;

      setLoadingStep("Paso 2/4 — Construyendo estructura...");
      const p2="Voy a hacer este YouTube Short: "+JSON.stringify(ideaElegida)+". Dame SOLO la estructura del guion, sin escribir el contenido todavia. Debe ser un proceso que lleve a un resultado claro, maximo 3 partes ademas del hook (formato short de 55-60 segundos). Cada parte debe existir por una razon. Responde SOLO JSON: {\"estructura\":[\"parte1 descripcion breve\",\"parte2 descripcion breve\",\"parte3 descripcion breve\"]}. Sin markdown.";
      const r2=await callClaude(p2,config);
      const estructura=JSON.parse(r2.replace(/```json|```/g,"").trim());

      setLoadingStep("Paso 3/4 — Creando el hook...");
      const p3="Escribe un hook de 3 segundos para este short: "+JSON.stringify(ideaElegida)+" con esta estructura: "+JSON.stringify(estructura.estructura)+". Idioma "+lL+", estilo "+sL+". No empieces explicando, no suene a tutorial. Genera curiosidad o tension: describe una situacion real, rompe una creencia, o contradice lo que la persona piensa. No resuelvas el problema todavia. Responde SOLO JSON: {\"hook\":\"texto del hook\"}. Sin markdown.";
      const r3=await callClaude(p3,config);
      const hookData=JSON.parse(r3.replace(/```json|```/g,"").trim());

      setLoadingStep("Paso 4/4 — Desarrollando guion completo y cierre...");
      const p4="Desarrolla el guion completo de este YouTube Short.\nIDEA: "+JSON.stringify(ideaElegida)+"\nESTRUCTURA: "+JSON.stringify(estructura.estructura)+"\nHOOK: "+JSON.stringify(hookData.hook)+"\nIdioma: "+lL+", Estilo: "+sL+". Sin emojis, sin marca personal, lenguaje simple para voz IA, sin listas dentro del guion hablado.\nEl desarrollo debe explicar una idea clara con un ejemplo que se entienda rapido. El final NO debe ser un resumen generico: recuerda el problema inicial desde una nueva perspectiva y cierra con una idea clara que se quede en la cabeza, conectando con el inicio.\nResponde SOLO JSON:\n{\"titulo\":\"texto\",\"duracion_total\":\"55-60 segundos\",\"escenas\":[{\"numero\":1,\"tipo\":\"HOOK\",\"duracion\":\"3 segundos\",\"guion\":\"texto\",\"prompt_video\":\"prompt ingles\",\"busqueda_clip\":\"keyword ingles\"},{\"numero\":2,\"tipo\":\"DESARROLLO\",\"duracion\":\"45 segundos\",\"guion\":\"texto\",\"prompt_video\":\"prompt ingles\",\"busqueda_clip\":\"keyword ingles\"},{\"numero\":3,\"tipo\":\"CIERRE\",\"duracion\":\"10 segundos\",\"guion\":\"texto\",\"prompt_video\":\"prompt ingles\",\"busqueda_clip\":\"keyword ingles\"}]}\nSolo JSON sin markdown.";
      const text=await callClaude(p4,config);
      const clean=text.replace(/```json|```/g,"").trim();
      const finalScript=JSON.parse(clean);
      setScript(finalScript);
      autoFetchAllClips(finalScript);
    }catch(e){setError("Error generando. Verifica tu Anthropic API key y saldo.");}
    setLoading(false);setLoadingStep("");
  };

  const useOwnScript=async function(){
    if(!ownScript.trim())return;
    setLoading(true);setError("");setScript(null);setClips({});
    setLoadingStep("Analizando tu guion y dividiendo en escenas...");
    try{
      const prompt="Toma este guion de YouTube Short escrito por el usuario y divídelo en escenas (HOOK, DESARROLLO, CIERRE) sin modificar el texto original, solo organizándolo. Para cada escena genera un prompt de video en ingles y una keyword de busqueda de stock footage en ingles.\nGUION DEL USUARIO:\n"+ownScript+"\n\nResponde SOLO JSON:\n{\"titulo\":\"titulo corto basado en el guion\",\"duracion_total\":\"estimado\",\"escenas\":[{\"numero\":1,\"tipo\":\"HOOK\",\"duracion\":\"estimado\",\"guion\":\"texto exacto del usuario para esta parte\",\"prompt_video\":\"prompt ingles\",\"busqueda_clip\":\"keyword ingles\"}]}\nDivide en 2 a 4 escenas segun el contenido. Solo JSON sin markdown.";
      const text=await callClaude(prompt,config);
      const clean=text.replace(/```json|```/g,"").trim();
      const finalScript=JSON.parse(clean);
      setScript(finalScript);
      autoFetchAllClips(finalScript);
    }catch(e){setError("Error procesando tu guion. Verifica tu Anthropic API key.");}
    setLoading(false);setLoadingStep("");
  };

  const autoFetchAllClips=async function(scr){
    if(!scr||!scr.escenas)return;
    for(const e of scr.escenas){
      fetchClips(e);
    }
  };

  const fetchClips=async function(e){
    setLoadClips(function(p){const np=Object.assign({},p);np[e.numero]=true;return np;});
    try{
      const results=await Promise.all([searchPexels(e.busqueda_clip,config),config.pixabayKey?searchPixabay(e.busqueda_clip,config):Promise.resolve([])]);
      setClips(function(p){const np=Object.assign({},p);np[e.numero]={px:results[0],pb:results[1]};return np;});
    }catch(err){}
    setLoadClips(function(p){const np=Object.assign({},p);np[e.numero]=false;return np;});
  };

  const handleAudioUpload=function(ev){
    const file=ev.target.files&&ev.target.files[0];
    if(!file)return;
    setOwnAudioName(file.name);
    const url=URL.createObjectURL(file);
    setOwnAudioUrl(url);
  };

  const sc={HOOK:"#f0b429",DESARROLLO:"#6c3fff",CIERRE:"#22c55e"};

  return(
    <div>
      <div className="ptitle">⚡ Generar Short</div>
      <div className="psub">Script completo con prompts y clips para cada escena.</div>

      <div className="tabs">
        <button className={"tab"+(mode==="ai"?" active":"")} onClick={function(){setMode("ai");}}>✨ Generar con IA</button>
        <button className={"tab"+(mode==="own"?" active":"")} onClick={function(){setMode("own");}}>📝 Ya tengo mi guion</button>
      </div>

      {mode==="ai"&&<div className="card">
        <div className="frow">
          <div className="fi" style={{flex:3}}><label className="lbl">Tema</label><input className="inp" placeholder="El silencio que transforma..." value={topic} onChange={function(e){setTopic(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")generate();}}/></div>
          <div className="fi"><label className="lbl">Idioma</label><select className="inp" value={lang} onChange={function(e){setLang(e.target.value);}}>{LANGUAGES.map(function(l){return <option key={l.code} value={l.code}>{l.label}</option>;})}</select></div>
          <div className="fi"><label className="lbl">Estilo</label><select className="inp" value={style} onChange={function(e){setStyle(e.target.value);}}>{STYLES.map(function(s){return <option key={s.code} value={s.code}>{s.label}</option>;})}</select></div>
          <button className="btn bg" onClick={generate} disabled={loading||!topic.trim()}>{loading?"⏳":"⚡ Generar"}</button>
        </div>
      </div>}

      {mode==="own"&&<div className="card">
        <label className="lbl">Pega tu guion completo</label>
        <textarea className="inp" style={{minHeight:160,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder="Pega aqui tu guion ya escrito..." value={ownScript} onChange={function(e){setOwnScript(e.target.value);}}/>
        <div style={{marginTop:14}}>
          <label className="lbl">Audio propio (opcional)</label>
          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <label className="btn bs" style={{cursor:"pointer"}}>
              🎵 Subir audio
              <input type="file" accept="audio/*" style={{display:"none"}} onChange={handleAudioUpload}/>
            </label>
            {ownAudioName&&<span style={{fontSize:12,color:"#7878a0"}}>{ownAudioName}</span>}
          </div>
          {ownAudioUrl&&<audio controls src={ownAudioUrl} style={{width:"100%",marginTop:10}}/>}
        </div>
        <button className="btn bg" onClick={useOwnScript} disabled={loading||!ownScript.trim()} style={{marginTop:16}}>{loading?"⏳":"📋 Organizar en escenas"}</button>
      </div>}

      {error&&<div className="alert aerr">⚠️ {error}</div>}
      {loading&&<div className="loader"><div className="spin"/><span>{loadingStep||"Procesando..."}</span></div>}

      {script&&<div>
        <div className="card" style={{borderColor:"#f0b429"}}>
          <div style={{fontSize:17,fontWeight:700}}>{script.titulo}</div>
          <div style={{fontSize:12,color:"#7878a0",marginTop:4}}>⏱ {script.duracion_total}</div>
          {ownAudioUrl&&<audio controls src={ownAudioUrl} style={{width:"100%",marginTop:10}}/>}
        </div>
        {script.escenas&&script.escenas.map(function(e){
          return <div key={e.numero} className="sc">
            <div className="sh">
              <div className="sn" style={{background:sc[e.tipo]||"#6c3fff"}}>{e.numero}</div>
              <div><div style={{fontSize:11,fontWeight:700,color:sc[e.tipo]||"#6c3fff",textTransform:"uppercase"}}>{e.tipo}</div><div style={{fontSize:11,color:"#7878a0"}}>{e.duracion}</div></div>
            </div>
            <span className="lbl">Guion</span>
            <div className="stxt">{e.guion}</div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}><CopyBtn text={e.guion}/></div>
            <span className="lbl">Prompt Veo3 / Runway / Sora</span>
            <div className="pbox">{e.prompt_video}</div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}><CopyBtn text={e.prompt_video}/></div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span className="lbl" style={{marginBottom:0}}>Clips — {e.busqueda_clip}</span>
              <button className="btn bs" style={{fontSize:12,padding:"5px 12px"}} onClick={function(){fetchClips(e);}} disabled={loadClips[e.numero]}>{loadClips[e.numero]?"Buscando...":"🎬 Rebuscar clips"}</button>
            </div>
            {loadClips[e.numero]&&<div style={{fontSize:12,color:"#7878a0",marginBottom:8}}>Buscando clips automáticamente...</div>}
            {clips[e.numero]&&<div className="cgrid">
              {clips[e.numero].px&&clips[e.numero].px.slice(0,3).map(function(v){return <div key={v.id} className="ci"><video src={v.video_files&&v.video_files[0]?v.video_files[0].link:""} muted loop controls/><span className="csrc">Pexels</span></div>;})}
              {clips[e.numero].pb&&clips[e.numero].pb.slice(0,3).map(function(v){return <div key={v.id} className="ci"><video src={v.videos&&v.videos.small?v.videos.small.url:""} muted loop controls/><span className="csrc">Pixabay</span></div>;})}
            </div>}
          </div>;
        })}
        <div className="card">
          <span className="lbl">Script completo</span>
          <div className="stxt" style={{marginTop:8}}>{script.escenas?script.escenas.map(function(e){return "["+e.tipo+" - "+e.duracion+"]\n"+e.guion;}).join("\n\n"):""}</div>
        </div>
      </div>}
    </div>
  );
            }
function LongFormPage(props){
  const config = props.config;
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
  const generate=async function(){
    if(!topic.trim())return;
    setLoading(true);setError("");setScript(null);setClips({});
    try{
      const lObj=LANGUAGES.find(function(l){return l.code===lang;});
      const lL=lObj?lObj.label:"español neutro";
      const sObj=STYLES.find(function(s){return s.code===style;});
      const sL=sObj?sObj.label:"reflexivo";
      const durNum=parseInt(duration);
      const n=durNum>=60?8:durNum>=45?6:durNum>=30?5:durNum>=20?4:durNum>=15?3:2;
      const prompt="Crea estructura de video de "+duration+" minutos sobre: "+JSON.stringify(topic)+"\nIdioma: "+lL+", Estilo: "+sL+", "+n+" escenas, canal faceless.\n\nResponde SOLO en JSON valido:\n{\"titulo\":\"titulo SEO\",\"descripcion\":\"texto 150 palabras\",\"duracion_total\":\""+duration+" minutos\",\"palabras_clave\":[\"kw1\",\"kw2\",\"kw3\",\"kw4\",\"kw5\"],\"escenas\":[{\"numero\":1,\"tipo\":\"INTRO\",\"titulo_bloque\":\"texto\",\"duracion\":\"X min\",\"guion\":\"minimo 100 palabras\",\"prompt_video\":\"prompt ingles detallado\",\"busqueda_clip\":\"keyword ingles\"}]}\nTipos: INTRO, DESARROLLO, CIERRE. Solo JSON sin markdown.";
      const text=await callClaude(prompt,config);
      const clean=text.replace(/```json|```/g,"").trim();
      setScript(JSON.parse(clean));
      setOpen(1);
    }catch(e){setError("Error generando. Verifica tu Anthropic API key.");}
    setLoading(false);
  };
  const fetchClips=async function(e){
    setLoadClips(function(p){const np=Object.assign({},p);np[e.numero]=true;return np;});
    try{
      const results=await Promise.all([searchPexels(e.busqueda_clip,config),config.pixabayKey?searchPixabay(e.busqueda_clip,config):Promise.resolve([])]);
      setClips(function(p){const np=Object.assign({},p);np[e.numero]={px:results[0],pb:results[1]};return np;});
    }catch(err){}
    setLoadClips(function(p){const np=Object.assign({},p);np[e.numero]=false;return np;});
  };
  const sc={INTRO:"#f0b429",DESARROLLO:"#6c3fff",CIERRE:"#22c55e"};
  return(
    <div>
      <div className="ptitle">📽️ Videos Largos</div>
      <div className="psub">Script por escenas con prompts y clips para 10-60 minutos.</div>
      <div className="card">
        <div className="frow">
          <div className="fi" style={{flex:3}}><label className="lbl">Tema</label><input className="inp" placeholder="La disciplina como camino espiritual..." value={topic} onChange={function(e){setTopic(e.target.value);}}/></div>
          <div className="fi"><label className="lbl">Duración</label><select className="inp" value={duration} onChange={function(e){setDuration(e.target.value);}}>
            <option value="10">10 min</option>
            <option value="15">15 min</option>
            <option value="20">20 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
          </select></div>
          <div className="fi"><label className="lbl">Idioma</label><select className="inp" value={lang} onChange={function(e){setLang(e.target.value);}}>{LANGUAGES.map(function(l){return <option key={l.code} value={l.code}>{l.label}</option>;})}</select></div>
          <div className="fi"><label className="lbl">Estilo</label><select className="inp" value={style} onChange={function(e){setStyle(e.target.value);}}>{STYLES.map(function(s){return <option key={s.code} value={s.code}>{s.label}</option>;})}</select></div>
          <button className="btn bp" onClick={generate} disabled={loading||!topic.trim()} style={{alignSelf:"flex-end"}}>{loading?"⏳":"📽️ Generar"}</button>
        </div>
      </div>
      {error&&<div className="alert aerr">⚠️ {error}</div>}
      {loading&&<div className="loader"><div className="spin"/><span>Generando estructura completa...</span></div>}
      {script&&<div>
        <div className="card" style={{borderColor:"#6c3fff"}}>
          <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>{script.titulo}</div>
          <div style={{fontSize:13,color:"#7878a0",lineHeight:1.6,marginBottom:12}}>{script.descripcion}</div>
          <div className="kwr">{script.palabras_clave&&script.palabras_clave.map(function(kw){return <span key={kw} className="tag ta">{kw}</span>;})}</div>
          <div style={{marginTop:12,display:"flex",gap:10}}><span className="tag tg">⏱ {script.duracion_total}</span><span className="tag tok">{script.escenas?script.escenas.length:0} bloques</span></div>
        </div>
        {script.escenas&&script.escenas.map(function(e){
          return <div key={e.numero} className="sc">
            <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={function(){setOpen(open===e.numero?null:e.numero);}}>
              <div className="sn" style={{background:sc[e.tipo]||"#6c3fff"}}>{e.numero}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:sc[e.tipo]||"#6c3fff",textTransform:"uppercase"}}>{e.tipo}</div>
                <div style={{fontSize:14,fontWeight:600}}>{e.titulo_bloque}</div>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}><span className="tag">{e.duracion}</span><span style={{color:"#7878a0"}}>{open===e.numero?"▲":"▼"}</span></div>
            </div>
            {open===e.numero&&<div>
              <div style={{marginTop:12}}><span className="lbl">Guion</span><div className="stxt">{e.guion}</div><div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><CopyBtn text={e.guion}/></div></div>
              <span className="lbl">Prompt Veo3 / Runway / Sora</span>
              <div className="pbox">{e.prompt_video}</div>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><CopyBtn text={e.prompt_video}/></div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span className="lbl" style={{marginBottom:0}}>Clips — {e.busqueda_clip}</span>
                <button className="btn bs" style={{fontSize:12,padding:"5px 12px"}} onClick={function(){fetchClips(e);}} disabled={loadClips[e.numero]}>{loadClips[e.numero]?"Buscando...":"🎬 Buscar clips"}</button>
              </div>
              {clips[e.numero]&&<div className="cgrid">
                {clips[e.numero].px&&clips[e.numero].px.slice(0,3).map(function(v){return <div key={v.id} className="ci"><video src={v.video_files&&v.video_files[0]?v.video_files[0].link:""} muted loop controls/><span className="csrc">Pexels</span></div>;})}
                {clips[e.numero].pb&&clips[e.numero].pb.slice(0,3).map(function(v){return <div key={v.id} className="ci"><video src={v.videos&&v.videos.small?v.videos.small.url:""} muted loop controls/><span className="csrc">Pixabay</span></div>;})}
              </div>}
            </div>}
          </div>;
        })}
        <div className="card">
          <span className="lbl">Guion completo</span>
          <div className="stxt" style={{marginTop:8}}>{script.escenas?script.escenas.map(function(e){return "["+e.tipo+" — "+e.titulo_bloque+"]\n"+e.guion;}).join("\n\n─────────────────────\n\n"):""}</div>
        </div>
      </div>}
    </div>
  );
}

export default function App(){
  const [config,setConfig]=useState(null);
  const [page,setPage]=useState("config");
  useEffect(function(){
    const s=loadConfig();
    if(s&&s.youtubeKey&&s.anthropicKey){setConfig(s);setPage("research");}
  },[]);
  const handleConfig=function(cfg){setConfig(cfg);if(cfg.youtubeKey&&cfg.anthropicKey)setPage("research");};
  const configured=!!(config&&config.youtubeKey&&config.anthropicKey);
  let pageContent;
  if(page==="config")pageContent=<ConfigPage config={config} setConfig={handleConfig}/>;
  else if(page==="research")pageContent=<ResearchPage config={config}/>;
  else if(page==="analyzer")pageContent=<AnalyzerPage config={config}/>;
  else if(page==="shorts")pageContent=<ShortsPage config={config}/>;
  else if(page==="longform")pageContent=<LongFormPage config={config}/>;
  return(
    <div>
      <style>{css}</style>
      <div className="app">
        <Sidebar page={page} setPage={setPage} configured={configured}/>
        <div className="main">{pageContent}</div>
      </div>
    </div>
  );
}
