import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Loader2, Check, AlertCircle, Download, ChevronRight, ArrowLeft, Play, Flame, Laugh, Star, Sparkles, Zap, Target, Scissors, Type } from 'lucide-react';

interface Props { onClose: () => void }
type Step = 0 | 1 | 2 | 3 | 4;

const M = [
  { id: 'viral' as const, icon: Flame, label: 'Viral', desc: 'Most engaging moment' },
  { id: 'funny' as const, icon: Laugh, label: 'Funny', desc: 'Humorous highlight' },
  { id: 'dramatic' as const, icon: Star, label: 'Dramatic', desc: 'Emotional peak' },
  { id: 'inspiring' as const, icon: Sparkles, label: 'Inspiring', desc: 'Motivational' },
  { id: 'surprising' as const, icon: Zap, label: 'Surprising', desc: 'Unexpected twist' },
  { id: 'action' as const, icon: Target, label: 'Action', desc: 'High intensity' },
];

const D = { font: 'Impact', fontSize: '52', colour: '#FFFFFF', position: 'bottom' as 'bottom'|'centre'|'top' };

export default function AIClipper({ onClose }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [url, setUrl] = useState('');
  const [moment, setMoment] = useState('viral');
  const [custom, setCustom] = useState('');
  const [cfg, setCfg] = useState(D);
  const [name, setName] = useState('');
  const [len, setLen] = useState('40');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const seenSteps = useRef<Set<string>>(new Set());

  useEffect(() => { if (step!==3) return; const i=setInterval(()=>setElapsed(e=>e+1),1000); return ()=>clearInterval(i); }, [step]);

  const run = useCallback(async () => {
    setStep(3); setError(''); setResult(null); setElapsed(0); setProgress(0);
    seenSteps.current = new Set();
    const m = custom.trim() || moment || 'viral';
    try {
      const res = await fetch('/api/clipper/start', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ url:url.trim(), config:{ font:cfg.font, font_size:parseInt(cfg.fontSize), text_colour:cfg.colour, position:cfg.position, moment_type:m, clip_duration:parseInt(len), clip_name:name.trim()||`clip-${Date.now()}` } }) });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const reader = res.body?.getReader(); if (!reader) throw new Error('No stream');
      const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, {stream:true});
        for (const line of buf.split('\n')) { buf = buf.includes('\n') ? buf.split('\n').pop()||'' : '';
          const t = line.trim(); if (!t.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(t.slice(6));
            if (ev.type==='error') throw new Error(ev.message);
            if (ev.type==='progress' && ev.step) {
              setStatus(ev.message||ev.step);
              seenSteps.current.add(ev.step);
              setProgress(Math.round(Math.min(98, (seenSteps.current.size / Math.max(5,seenSteps.current.size+1)) * 100)));
            }
            if (ev.type==='complete') { setResult(ev); setProgress(100); setStep(4); return; }
          } catch(e) { if (e instanceof Error && e.message.includes('Pipeline')) throw e; }
        }
      }
    } catch(e: any) { setError(e.message); setStep(0); }
  }, [url, cfg, moment, custom, name, len]);

  const ps = { fontFamily:cfg.font, fontSize:`${Math.min(parseInt(cfg.fontSize)*.45,42)}px`, color:cfg.colour, textShadow:'1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontWeight:700 as const };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.2}}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{background:'rgba(255,255,255,0.92)', backdropFilter:'blur(24px) saturate(180%)', WebkitBackdropFilter:'blur(24px) saturate(180%)'}}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{background:'rgba(255,255,255,0.6)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
        <button onClick={onClose} className="p-2 -ml-2 rounded-xl hover:bg-white/80 transition-all duration-200"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
        <div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center"><Scissors className="w-3.5 h-3.5 text-white" /></div><span className="text-sm font-semibold text-slate-800 tracking-tight">AI Clip</span></div>
        <div className="w-9" />
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {step===0 && (
            <motion.div key="url" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:.25,ease:[.22,1,.36,1]}} className="w-full max-w-md text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{background:'rgba(0,0,0,0.03)', border:'1px solid rgba(0,0,0,0.06)'}}><Youtube className="w-8 h-8 text-slate-700" /></div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Create a clip</h2>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">Paste a YouTube link. AI finds the best moment and adds word-accurate subtitles.</p>
              <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://youtu.be/..." 
                className="w-full px-5 py-4 rounded-2xl text-sm transition-all duration-200 focus:outline-none"
                style={{background:'rgba(0,0,0,0.02)', border:'1px solid rgba(0,0,0,0.08)', backdropFilter:'blur(8px)'}}
                autoFocus onKeyDown={e=>e.key==='Enter'&&url.includes('youtu')&&setStep(1)} />
              <button onClick={()=>setStep(1)} disabled={!url.includes('youtu')}
                className="mt-4 w-full py-4 rounded-2xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-30 hover:scale-[1.01] active:scale-[0.99]"
                style={{background:'linear-gradient(135deg, #1a1a2e, #16213e)'}}>
                Continue <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </motion.div>
          )}

          {step===1 && (
            <motion.div key="moment" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:.25,ease:[.22,1,.36,1]}} className="w-full max-w-lg">
              <div className="text-center mb-7"><h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Find the perfect moment</h2><p className="text-sm text-slate-500">Choose a vibe or describe what you want</p></div>
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {M.map((m,i)=>{const I=m.icon;const sel=moment===m.id&&!custom.trim();
                  return (<motion.button key={m.id} whileTap={{scale:.97}} onClick={()=>{setMoment(m.id);setCustom('')}} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.04,duration:.25}}
                    style={sel?{background:'linear-gradient(135deg, #1a1a2e, #16213e)',border:'1px solid transparent',color:'white'}:{background:'rgba(255,255,255,0.7)',border:'1px solid rgba(0,0,0,0.06)',backdropFilter:'blur(8px)'}}
                    className="flex flex-col items-center gap-1.5 py-4 rounded-2xl transition-all duration-200">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${sel?'bg-white/15':'bg-slate-50'}`}><I className={`w-4.5 h-4.5 ${sel?'text-white':'text-slate-500'}`} /></div>
                    <span className={`text-xs font-semibold tracking-wide uppercase ${sel?'text-white/90':'text-slate-500'}`}>{m.label}</span>
                  </motion.button>);
                })}
              </div>
              <div className="relative mb-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/5" /></div><div className="relative flex justify-center"><span className="px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest" style={{background:'rgba(255,255,255,0.92)'}}>or custom</span></div></div>
              <textarea value={custom} onChange={e=>{setCustom(e.target.value);if(e.target.value.trim())setMoment('')}}
                placeholder='"the part where they jump out" or "the emotional reveal"...' rows={2}
                className="w-full px-4 py-3.5 rounded-2xl text-sm placeholder-slate-400 focus:outline-none transition-all duration-200 resize-none"
                style={{background:'rgba(0,0,0,0.02)', border:'1px solid rgba(0,0,0,0.06)', backdropFilter:'blur(8px)'}} />
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setStep(0)} style={{background:'rgba(255,255,255,0.7)',border:'1px solid rgba(0,0,0,0.06)',backdropFilter:'blur(8px)'}} className="px-5 py-3.5 rounded-2xl text-sm font-medium text-slate-600 hover:bg-white/90 transition-all">Back</button>
                <button onClick={()=>setStep(2)} disabled={!moment&&!custom.trim()}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  style={{background:'linear-gradient(135deg, #1a1a2e, #16213e)'}}>Continue <ChevronRight className="w-4 h-4 inline ml-1" /></button>
              </div>
            </motion.div>
          )}

          {step===2 && (
            <motion.div key="config" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:.25,ease:[.22,1,.36,1]}} className="w-full max-w-lg">
              <div className="flex items-center gap-3 mb-5"><Type className="w-5 h-5 text-slate-600" /><h2 className="text-lg font-semibold text-slate-900">Subtitle style</h2></div>
              <div className="relative aspect-video bg-slate-900 rounded-2xl mb-5 overflow-hidden" style={{border:'1px solid rgba(0,0,0,0.08)'}}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <Play className="w-12 h-12 text-white/25 absolute inset-0 m-auto" />
                <div className={`absolute ${cfg.position==='top'?'top-8':cfg.position==='centre'?'top-1/2 -translate-y-1/2':'bottom-8'} left-1/2 -translate-x-1/2 text-center pointer-events-none`}><span style={ps}>SUBTITLES</span></div>
              </div>
              <div className="space-y-2.5">
                {[
                  {label:'Size', content: <div className="flex gap-1.5 flex-1">{[{l:'S',v:'36'},{l:'M',v:'52'},{l:'L',v:'68'}].map(o=>(<button key={o.v} onClick={()=>setCfg({...cfg,fontSize:o.v})} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${cfg.fontSize===o.v?'bg-slate-900 text-white border-slate-900':'text-slate-600 border-black/5 hover:bg-white/80'}`} style={cfg.fontSize!==o.v?{background:'rgba(255,255,255,0.6)',backdropFilter:'blur(8px)'}:{}}>{o.l} ({o.v}px)</button>))}</div>},
                  {label:'Font', content: <select value={cfg.font} onChange={e=>setCfg({...cfg,font:e.target.value})} className="flex-1 px-3 py-2 rounded-xl text-xs focus:outline-none" style={{background:'rgba(255,255,255,0.6)',border:'1px solid rgba(0,0,0,0.06)',backdropFilter:'blur(8px)'}}>{['Impact','Arial','Montserrat'].map(f=><option key={f}>{f}</option>)}</select>},
                  {label:'Colour', content: <><input type="color" value={cfg.colour} onChange={e=>setCfg({...cfg,colour:e.target.value})} className="w-9 h-9 rounded-xl cursor-pointer" style={{border:'1px solid rgba(0,0,0,0.06)'}} /><input value={cfg.colour} onChange={e=>setCfg({...cfg,colour:e.target.value})} className="flex-1 px-3 py-2 rounded-xl text-xs font-mono focus:outline-none" style={{background:'rgba(255,255,255,0.6)',border:'1px solid rgba(0,0,0,0.06)'}} /></>},
                  {label:'Pos', content: <div className="flex gap-1.5 flex-1">{[{l:'Bottom',v:'bottom'},{l:'Center',v:'centre'},{l:'Top',v:'top'}].map(o=>(<button key={o.v} onClick={()=>setCfg({...cfg,position:o.v as any})} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${cfg.position===o.v?'bg-slate-900 text-white border-slate-900':'text-slate-600 border-black/5 hover:bg-white/80'}`} style={cfg.position!==o.v?{background:'rgba(255,255,255,0.6)',backdropFilter:'blur(8px)'}:{}}>{o.l}</button>))}</div>},
                  {label:'Len', content: <div className="flex gap-1.5 flex-1">{[{l:'30s',v:'30'},{l:'40s',v:'40'},{l:'60s',v:'60'}].map(o=>(<button key={o.v} onClick={()=>setLen(o.v)} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${len===o.v?'bg-slate-900 text-white border-slate-900':'text-slate-600 border-black/5 hover:bg-white/80'}`} style={len!==o.v?{background:'rgba(255,255,255,0.6)',backdropFilter:'blur(8px)'}:{}}>{o.l}</button>))}</div>},
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3"><span className="text-xs font-medium text-slate-500 w-12 shrink-0">{row.label}</span>{row.content}</div>
                ))}
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Clip name (optional)" className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none transition-all duration-200" style={{background:'rgba(0,0,0,0.02)',border:'1px solid rgba(0,0,0,0.06)'}} />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setStep(1)} style={{background:'rgba(255,255,255,0.7)',border:'1px solid rgba(0,0,0,0.06)',backdropFilter:'blur(8px)'}} className="flex-1 py-3.5 rounded-2xl text-sm font-medium text-slate-600 hover:bg-white/90 transition-all">Back</button>
                <button onClick={run} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]" style={{background:'linear-gradient(135deg, #1a1a2e, #16213e)'}}>Start Clipping</button>
              </div>
            </motion.div>
          )}

          {step===3 && (
            <motion.div key="proc" initial={{opacity:0}} animate={{opacity:1}} className="w-full max-w-sm text-center">
              <div className="relative w-28 h-28 mx-auto mb-6">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="2.5" />
                  <motion.circle cx="50" cy="50" r="40" fill="none" stroke="url(#g)" strokeWidth="2.5" strokeLinecap="round"
                    strokeDasharray={2*Math.PI*40} animate={{strokeDashoffset:2*Math.PI*40*(1-Math.min(progress,98)/100)}} transition={{duration:.4,ease:'easeOut'}} />
                  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1a1a2e"/><stop offset="100%" stopColor="#16213e"/></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl font-bold text-slate-900 tabular-nums">{progress}%</span></div>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Creating your clip</h2>
              <p className="text-sm text-slate-500 mb-6">{status||'Starting pipeline...'}</p>
              <div className="h-1 rounded-full overflow-hidden mb-3" style={{background:'rgba(0,0,0,0.04)'}}><motion.div className="h-full rounded-full" style={{background:'linear-gradient(90deg, #1a1a2e, #16213e)'}} animate={{width:`${progress}%`}} transition={{duration:.4,ease:'easeOut'}} /></div>
              <p className="text-xs text-slate-400">{elapsed}s · ~{Math.max(2,40-elapsed)}s left</p>
            </motion.div>
          )}

          {step===4 && result && (
            <motion.div key="done" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.3,ease:[.22,1,.36,1]}} className="w-full max-w-lg text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.15)'}}><Check className="w-8 h-8 text-emerald-600" /></div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-1">Clip ready</h2>
              <p className="text-sm text-slate-500 mb-1">{result.title}</p>
              <p className="text-xs text-slate-400 mb-6">{result.original_duration} → {result.clip_duration} · {result.reason}</p>
              <video controls src={result.output?.replace('./output/','/output/')} className="w-full rounded-2xl mb-5 bg-black" style={{border:'1px solid rgba(0,0,0,0.06)'}} />
              <div className="flex gap-3">
                <a href={result.output?.replace('./output/','/output/')} download className="flex-1 py-4 rounded-2xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2" style={{background:'linear-gradient(135deg, #1a1a2e, #16213e)'}}><Download className="w-4 h-4" /> Download</a>
                <button onClick={()=>{setStep(0);setResult(null);setUrl('');setError('')}} style={{background:'rgba(255,255,255,0.7)',border:'1px solid rgba(0,0,0,0.06)',backdropFilter:'blur(8px)'}} className="px-6 py-4 rounded-2xl text-sm font-medium text-slate-600 hover:bg-white/90 transition-all">New</button>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div key="err" initial={{opacity:0}} animate={{opacity:1}} className="w-full max-w-sm text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.15)'}}><AlertCircle className="w-8 h-8 text-red-600" /></div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Error</h2>
              <p className="text-sm text-slate-500 mb-6">{error}</p>
              <button onClick={()=>{setError('');setStep(0)}} className="px-8 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200" style={{background:'linear-gradient(135deg, #1a1a2e, #16213e)'}}>Try again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
