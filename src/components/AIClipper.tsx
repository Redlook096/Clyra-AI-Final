import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Loader2, Check, AlertCircle, Download, ChevronRight, ArrowLeft, Play, Flame, Laugh, Star, Sparkles, Zap, Target, Scissors, Type } from 'lucide-react';

interface Props { onClose: () => void }
type Step = 0 | 1 | 2 | 3 | 4;

const M = [
  { id: 'viral' as const, icon: Flame, label: 'Viral Moment', desc: 'Most engaging, shareable segment' },
  { id: 'funny' as const, icon: Laugh, label: 'Funny Moment', desc: 'Humorous or comedic highlight' },
  { id: 'dramatic' as const, icon: Star, label: 'Dramatic Moment', desc: 'Emotional peak or turning point' },
  { id: 'inspiring' as const, icon: Sparkles, label: 'Inspirational', desc: 'Motivational or uplifting' },
  { id: 'surprising' as const, icon: Zap, label: 'Surprising Twist', desc: 'Unexpected reveal or shock' },
  { id: 'action' as const, icon: Target, label: 'Action Packed', desc: 'High intensity, fast-paced' },
];

const D = { font: 'Impact', fontSize: '52', colour: '#FFFFFF', position: 'bottom' as 'bottom'|'centre'|'top' };
const fadeIn = { initial:{opacity:0,y:8}, animate:{opacity:1,y:0}, exit:{opacity:0,y:-8}, transition:{duration:0.25,ease:[0.22,1,0.36,1]as const} };

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
  const progressRef = useRef(0);
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
            if (ev.type==='progress') {
              setStatus(ev.message || ev.step);
              if (ev.step) {
                seenSteps.current.add(ev.step);
                const total = Math.max(5, seenSteps.current.size + 1);
                const completed = ev.status==='complete' ? seenSteps.current.size : seenSteps.current.size - 0.5;
                const pct = Math.round(Math.min(98, (completed / total) * 100));
                setProgress(pct);
              }
            }
            if (ev.type==='complete') { setResult(ev); setProgress(100); setStep(4); return; }
          } catch(e) { if (e instanceof Error && e.message.includes('Pipeline')) throw e; }
        }
      }
    } catch(e: any) { setError(e.message); setStep(0); }
  }, [url, cfg, moment, custom, name, len]);

  const ps = { fontFamily:cfg.font, fontSize:`${Math.min(parseInt(cfg.fontSize)*.45,42)}px`, color:cfg.colour, textShadow:'2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000', fontWeight:700 as const };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-white flex flex-col">
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"><ArrowLeft className="w-5 h-5 text-slate-400" /></button>
        <div className="flex items-center gap-2"><Scissors className="w-4 h-4 text-slate-700" /><span className="text-sm font-semibold text-slate-800">AI Clip</span></div>
        <div className="w-9" />
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step===0 && (
            <motion.div key="url" {...fadeIn} className="w-full max-w-md mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-5 ring-1 ring-slate-100"><Youtube className="w-7 h-7 text-slate-600" /></div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">Create a clip</h2>
              <p className="text-sm text-slate-500 mb-8">Paste a YouTube link — find the best moment</p>
              <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://youtu.be/..." className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all" autoFocus onKeyDown={e=>e.key==='Enter'&&url.includes('youtu')&&setStep(1)} />
              <button onClick={()=>setStep(1)} disabled={!url.includes('youtu')} className="mt-4 w-full py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-medium disabled:opacity-25 hover:bg-black transition-all">Continue <ChevronRight className="w-4 h-4 inline ml-1" /></button>
            </motion.div>
          )}

          {step===1 && (
            <motion.div key="moment" {...fadeIn} className="w-full max-w-lg mx-auto">
              <div className="text-center mb-6"><h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">Find the perfect moment</h2><p className="text-sm text-slate-500">Choose a vibe or describe exactly what you want</p></div>
              <div className="flex flex-col gap-1.5 mb-4">
                {M.map((m,i)=>{const I=m.icon;const sel=moment===m.id&&!custom.trim();
                  return (<motion.button key={m.id} whileTap={{scale:.99}} onClick={()=>{setMoment(m.id);setCustom('')}} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:i*.04,duration:.25}}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border transition-all duration-200 ${sel?'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10':'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${sel?'bg-white/15':'bg-slate-50'}`}><I className={`w-4 h-4 ${sel?'text-white':'text-slate-500'}`} /></div>
                    <div className="text-left flex-1"><div className={`text-sm font-semibold ${sel?'text-white':'text-slate-700'}`}>{m.label}</div><div className={`text-xs mt-0.5 ${sel?'text-white/60':'text-slate-400'}`}>{m.desc}</div></div>
                    {sel&&<Check className="w-4 h-4 text-white" />}
                  </motion.button>);
                })}
              </div>
              <div className="relative mb-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div><div className="relative flex justify-center"><span className="bg-white px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">or be specific</span></div></div>
              <textarea value={custom} onChange={e=>{setCustom(e.target.value);if(e.target.value.trim())setMoment('')}} placeholder='e.g. "the part where they jump out" or "the emotional reveal"...' rows={2} className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-50 transition-all resize-none bg-slate-50/50 focus:bg-white" />
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setStep(0)} className="px-5 py-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all">Back</button>
                <button onClick={()=>setStep(2)} disabled={!moment&&!custom.trim()} className="flex-1 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-25 hover:bg-black transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98]">Continue <ChevronRight className="w-4 h-4 inline ml-1" /></button>
              </div>
            </motion.div>
          )}

          {step===2 && (
            <motion.div key="config" {...fadeIn} className="w-full max-w-lg mx-auto">
              <div className="flex items-center gap-3 mb-4"><Type className="w-5 h-5 text-slate-700" /><h2 className="text-lg font-semibold text-slate-900">Subtitle style</h2></div>
              <div className="relative aspect-video bg-slate-900 rounded-2xl mb-5 overflow-hidden ring-1 ring-slate-200"><div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" /><Play className="w-12 h-12 text-white/30 absolute inset-0 m-auto" /><div className={`absolute ${cfg.position==='top'?'top-8':cfg.position==='centre'?'top-1/2 -translate-y-1/2':'bottom-8'} left-1/2 -translate-x-1/2 text-center pointer-events-none`}><span style={ps}>SUBTITLES PREVIEW</span></div></div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3"><span className="text-xs font-medium text-slate-500 w-12 shrink-0">Size</span><div className="flex gap-1.5 flex-1">{[{l:'S',v:'36'},{l:'M',v:'52'},{l:'L',v:'68'}].map(o=>(<button key={o.v} onClick={()=>setCfg({...cfg,fontSize:o.v})} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${cfg.fontSize===o.v?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{o.l} ({o.v}px)</button>))}</div></div>
                <div className="flex items-center gap-3"><span className="text-xs font-medium text-slate-500 w-12 shrink-0">Font</span><select value={cfg.font} onChange={e=>setCfg({...cfg,font:e.target.value})} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400">{['Impact','Arial','Montserrat'].map(f=><option key={f}>{f}</option>)}</select></div>
                <div className="flex items-center gap-3"><span className="text-xs font-medium text-slate-500 w-12 shrink-0">Colour</span><input type="color" value={cfg.colour} onChange={e=>setCfg({...cfg,colour:e.target.value})} className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer" /><input value={cfg.colour} onChange={e=>setCfg({...cfg,colour:e.target.value})} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-slate-400" /></div>
                <div className="flex items-center gap-3"><span className="text-xs font-medium text-slate-500 w-12 shrink-0">Pos</span><div className="flex gap-1.5 flex-1">{[{l:'Bottom',v:'bottom'},{l:'Center',v:'centre'},{l:'Top',v:'top'}].map(o=>(<button key={o.v} onClick={()=>setCfg({...cfg,position:o.v as any})} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${cfg.position===o.v?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{o.l}</button>))}</div></div>
                <div className="flex items-center gap-3"><span className="text-xs font-medium text-slate-500 w-12 shrink-0">Len</span><div className="flex gap-1.5 flex-1">{[{l:'30s',v:'30'},{l:'40s',v:'40'},{l:'60s',v:'60'}].map(o=>(<button key={o.v} onClick={()=>setLen(o.v)} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${len===o.v?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{o.l}</button>))}</div></div>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Clip name (optional)" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400 transition-all bg-slate-50 focus:bg-white" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={()=>setStep(1)} className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Back</button>
                <button onClick={run} className="flex-1 py-3 rounded-2xl bg-slate-900 text-white text-sm font-medium hover:bg-black transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98]">Start Clipping</button>
              </div>
            </motion.div>
          )}

          {step===3 && (
            <motion.div key="proc" initial={{opacity:0}} animate={{opacity:1}} className="w-full max-w-sm mx-auto text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={2*Math.PI*42} animate={{strokeDashoffset:2*Math.PI*42*(1-Math.min(progress,98)/100)}} transition={{duration:.4,ease:'easeOut'}} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-bold text-slate-900 tabular-nums">{progress}%</span></div>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Creating your clip</h2>
              <p className="text-sm text-slate-500 mb-6">{status||'Starting pipeline...'}</p>
              <motion.div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-3" animate={{opacity:1}}><motion.div className="h-full bg-slate-900 rounded-full" animate={{width:`${progress}%`}} transition={{duration:.4,ease:'easeOut'}} /></motion.div>
              <p className="text-xs text-slate-400">{elapsed}s elapsed · ~{Math.max(2,40-elapsed)}s remaining</p>
            </motion.div>
          )}

          {step===4 && result && (
            <motion.div key="done" {...fadeIn} className="w-full max-w-lg mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mx-auto mb-5"><Check className="w-7 h-7 text-emerald-600" /></div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-1">Clip ready</h2>
              <p className="text-sm text-slate-500 mb-1">{result.title}</p>
              <p className="text-xs text-slate-400 mb-6">{result.original_duration} → {result.clip_duration} · {result.reason}</p>
              <video controls src={result.output?.replace('./output/','/output/')} className="w-full rounded-2xl mb-5 bg-black ring-1 ring-slate-200" />
              <div className="flex gap-3">
                <a href={result.output?.replace('./output/','/output/')} download className="flex-1 py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-medium hover:bg-black transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download</a>
                <button onClick={()=>{setStep(0);setResult(null);setUrl('');setError('')}} className="px-6 py-3.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">New</button>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div key="err" initial={{opacity:0}} animate={{opacity:1}} className="w-full max-w-sm mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center mx-auto mb-5"><AlertCircle className="w-7 h-7 text-red-600" /></div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Error</h2>
              <p className="text-sm text-slate-500 mb-6">{error}</p>
              <button onClick={()=>{setError('');setStep(0)}} className="px-8 py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-medium">Try again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
