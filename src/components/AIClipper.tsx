import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Loader2, Check, AlertCircle, Download, ChevronRight, ArrowLeft, Play, Flame, Laugh, Star, Sparkles, Zap, Target, Scissors, Type } from 'lucide-react';

interface Props {
  onClose: () => void;
  initialUrl?: string;
  onClipReady?: (clip: { id: string; title: string; duration: string; outputPath: string }) => void;
}
type Step = 0 | 1 | 2 | 3 | 4;
type MomentType = 'viral' | 'funny' | 'dramatic' | 'inspiring' | 'surprising' | 'action' | '';

const MOMENTS: { id: MomentType; icon: typeof Flame; label: string; desc: string }[] = [
  { id: 'viral', icon: Flame, label: 'Viral Moment', desc: 'Most engaging, shareable segment' },
  { id: 'funny', icon: Laugh, label: 'Funny Moment', desc: 'Humorous or comedic highlight' },
  { id: 'dramatic', icon: Star, label: 'Dramatic Moment', desc: 'Emotional peak or turning point' },
  { id: 'inspiring', icon: Sparkles, label: 'Inspirational', desc: 'Motivational or uplifting segment' },
  { id: 'surprising', icon: Zap, label: 'Surprising Twist', desc: 'Unexpected reveal or shock' },
  { id: 'action', icon: Target, label: 'Action Packed', desc: 'High intensity, fast-paced moment' },
];

const DEFAULTS = { font: 'Impact', fontSize: '52', colour: '#FFFFFF', position: 'bottom' as 'bottom' | 'centre' | 'top' };

const FADE = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 }, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } };

function clipperDownloadHref(output?: string) {
  if (!output) return "";
  const normalized = output.replace(/^\.\//, "").replace(/^\/+/, "");
  const filename = normalized.split("/").pop();
  return filename ? `/api/clipper/download/${filename}` : "";
}

export default function AIClipper({ onClose, initialUrl = '', onClipReady }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [url, setUrl] = useState(initialUrl);
  const [moment, setMoment] = useState<MomentType>('viral');
  const [custom, setCustom] = useState('');
  const [cfg, setCfg] = useState(DEFAULTS);
  const [cname, setCname] = useState('');
  const [clipLen, setClipLen] = useState<string>('40');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
  }, [initialUrl]);

  useEffect(() => { if (step !== 3) return; const i = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(i); }, [step]);

  const run = useCallback(async () => {
    setStep(3); setError(''); setResult(null); setElapsed(0); setProgress(0);
    const m = custom.trim() || moment || 'viral';
    try {
      const res = await fetch('/api/clipper/start', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), config: { font: cfg.font, font_size: parseInt(cfg.fontSize), text_colour: cfg.colour, position: cfg.position, moment_type: m,
            clip_duration: parseInt(clipLen), clip_name: cname.trim() || `clip-${Date.now()}` } }) });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const reader = res.body?.getReader(); if (!reader) throw new Error('No stream');
      const dec = new TextDecoder(); let buf = '';
      const steps = ['captions','analyze','clip','transcribe','subtitles','render'];
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const packets = buf.split('\n\n');
        buf = packets.pop() || '';
        for (const packet of packets) {
          const dataLine = packet.split('\n').find((line) => line.trim().startsWith('data:'));
          if (!dataLine) continue;

          let ev: any;
          try {
            ev = JSON.parse(dataLine.replace(/^data:\s*/, ''));
          } catch {
            continue;
          }

          if (ev.type === 'error') throw new Error(ev.message || 'Clipper failed');

          if (ev.type === 'progress') {
            setStatus(ev.message || ev.step);
            const idx = steps.indexOf(ev.step);
            if (idx >= 0) setProgress(Math.round(((idx + (ev.status==='complete'?1:0.5)) / steps.length) * 100));
          }

          if (ev.step === 'complete' && ev.status === 'complete') {
            const outputPath = clipperDownloadHref(ev.output);
            const nextResult = { ...ev, output: outputPath };
            setResult(nextResult);
            onClipReady?.({
              id: `${Date.now()}`,
              title: ev.title || 'AI Clip',
              duration: ev.clip_duration || '',
              outputPath,
            });
            setStatus(ev.message || 'Clip ready');
            setProgress(100);
            setStep(4);
            return;
          }
        }
      }
    } catch(e: any) { setError(e.message); setStep(0); }
  }, [url, cfg, moment, custom, cname, clipLen, onClipReady]);

  const previewStyle = { fontFamily: cfg.font, fontSize: `${Math.min(parseInt(cfg.fontSize) * 0.45, 42)}px`, color: cfg.colour, textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000', fontWeight: 700 as const };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full min-h-0 w-full bg-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
        <div className="flex items-center gap-2"><Scissors className="w-4 h-4 text-slate-700" /><span className="text-sm font-semibold text-slate-800">AI Clip</span></div>
        <div className="w-9" />
      </header>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="url" {...FADE} className="w-full max-w-xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-5 ring-1 ring-slate-100"><Youtube className="w-7 h-7 text-slate-600" /></div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">Create a clip</h2>
              <p className="text-sm text-slate-500 mb-8">Paste a YouTube link. I'll find the best moment and add subtitles.</p>
              <div className="relative">
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtu.be/..." className="w-full pl-4 pr-4 py-3.5 rounded-2xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all" autoFocus onKeyDown={e => e.key === 'Enter' && url.includes('youtu') && setStep(1)} />
              </div>
              <button onClick={() => setStep(1)} disabled={!url.includes('youtu')} className="mt-4 w-full py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-medium disabled:opacity-25 hover:bg-black transition-all">Continue <ChevronRight className="w-4 h-4 inline ml-1" /></button>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="moment" {...FADE} className="w-full max-w-2xl">
              <div className="text-center mb-5">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Find the perfect moment</h2>
                <p className="text-sm text-slate-500">Choose a vibe or describe exactly what you want</p>
              </div>
              
              <div className="flex flex-col gap-1.5 mb-4">
                {MOMENTS.map((m, i) => { const Icon = m.icon; const sel = moment === m.id && !custom.trim();
                  return (
                    <motion.button key={m.id} whileTap={{ scale: 0.99 }} onClick={() => { setMoment(m.id); setCustom(''); }}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border transition-all duration-200 ${
                        sel ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10' 
                            : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${sel ? 'bg-white/15' : 'bg-slate-50'}`}>
                        <Icon className={`w-4 h-4 ${sel ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                      <div className="text-left">
                        <div className={`text-sm font-semibold ${sel ? 'text-white' : 'text-slate-700'}`}>{m.label}</div>
                        <div className={`text-xs mt-0.5 ${sel ? 'text-white/60' : 'text-slate-400'}`}>{m.desc || ''}</div>
                      </div>
                      {sel && <Check className="w-4 h-4 text-white ml-auto" />}
                    </motion.button>
                  );
                })}
              </div>
              
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">or be specific</span></div>
              </div>
              
              <textarea value={custom} onChange={e => { setCustom(e.target.value); if (e.target.value.trim()) setMoment(''); }}
                placeholder='e.g. "the part where they jump out" or "the emotional reveal at the end"...'
                rows={2} className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-50 transition-all resize-none bg-slate-50/50 focus:bg-white" />
              
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(0)} className="px-6 py-3.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">Back</button>
                <button onClick={() => setStep(2)} disabled={!moment && !custom.trim()} className="flex-1 py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-25 hover:bg-black transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98]">Continue to subtitles <ChevronRight className="w-4 h-4 inline ml-1" /></button>
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="config" {...FADE} className="w-full max-w-2xl">
              <div className="flex items-center gap-3 mb-5"><Type className="w-5 h-5 text-slate-700" /><h2 className="text-lg font-semibold text-slate-900">Subtitle style</h2></div>
              <div className="relative aspect-video bg-slate-900 rounded-2xl mb-6 overflow-hidden ring-1 ring-slate-200">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <Play className="w-12 h-12 text-white/30 absolute inset-0 m-auto" />
                <div className={`absolute ${cfg.position === 'top' ? 'top-8' : cfg.position === 'centre' ? 'top-1/2 -translate-y-1/2' : 'bottom-8'} left-1/2 -translate-x-1/2 text-center pointer-events-none`}>
                  <span style={previewStyle}>SUBTITLES PREVIEW</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3"><span className="text-xs font-medium text-slate-500 w-14 shrink-0">Size</span><div className="flex gap-1.5 flex-1">{[{l:'S',v:'36'},{l:'M',v:'52'},{l:'L',v:'68'}].map(o => (<button key={o.v} onClick={() => setCfg({...cfg, fontSize: o.v})} className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${cfg.fontSize===o.v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{o.l} ({o.v}px)</button>))}</div></div>
                <div className="flex items-center gap-3"><span className="text-xs font-medium text-slate-500 w-14 shrink-0">Font</span><select value={cfg.font} onChange={e => setCfg({...cfg, font: e.target.value})} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400">{['Impact','Arial','Montserrat'].map(f => <option key={f}>{f}</option>)}</select></div>
                <div className="flex items-center gap-3"><span className="text-xs font-medium text-slate-500 w-14 shrink-0">Colour</span><input type="color" value={cfg.colour} onChange={e => setCfg({...cfg, colour: e.target.value})} className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer" /><input value={cfg.colour} onChange={e => setCfg({...cfg, colour: e.target.value})} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-slate-400" /></div>
                <div className="flex items-center gap-3"><span className="text-xs font-medium text-slate-500 w-14 shrink-0">Position</span><div className="flex gap-1.5 flex-1">{[{l:'Bottom',v:'bottom'},{l:'Center',v:'centre'},{l:'Top',v:'top'}].map(o => (<button key={o.v} onClick={() => setCfg({...cfg, position: o.v as any})} className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${cfg.position===o.v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{o.l}</button>))}</div></div>
                <div className="flex items-center gap-3"><span className="text-xs font-medium text-slate-500 w-14 shrink-0">Duration</span><div className="flex gap-1.5 flex-1">{[{l:"30s",v:"30"},{l:"40s",v:"40"},{l:"60s",v:"60"}].map(o => (<button key={o.v} onClick={() => setClipLen(o.v)} className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${clipLen===o.v ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>{o.l}</button>))}</div></div>
                <input value={cname} onChange={e => setCname(e.target.value)} placeholder="Clip name (optional)" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400 transition-all bg-slate-50 focus:bg-white" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Back</button>
                <button onClick={run} className="flex-1 py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-medium hover:bg-black transition-all shadow-lg shadow-slate-900/10">Start Clipping</button>
              </div>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-xl">
              <div className="flex flex-col items-center mb-8">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="relative w-16 h-16 mb-6"
                >
                  <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
                  <motion.div 
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-slate-900"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  />
                </motion.div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Creating your clip</h2>
                <p className="text-sm text-slate-500">{status || 'Analyzing video...'}</p>
              </div>
              
              <div className="space-y-3 mb-6">
                {['captions','analyze','clip','transcribe','subtitles','render'].map((s) => {
                  const stepLabels: Record<string,string> = {captions:'Reading captions',analyze:'Finding best moment',clip:'Cutting exact clip',transcribe:'Timing every word',subtitles:'Building subtitles',render:'Encoding MP4'};
                  const stepIdx = ['captions','analyze','clip','transcribe','subtitles','render'].indexOf(s);
                  const isDone = progress >= ((stepIdx+1)/6)*100;
                  const isActive = !isDone && progress >= (stepIdx/6)*100;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isDone ? 'bg-emerald-50 text-emerald-600' : isActive ? 'bg-slate-100 text-slate-700' : 'bg-transparent text-slate-300'
                      }`}>
                        {isDone ? <Check className="w-3 h-3" /> : isActive ? <Loader2 className="w-3 h-3 animate-spin" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                      </div>
                      <span className={`text-sm transition-colors duration-300 ${isDone ? 'text-slate-500' : isActive ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>{stepLabels[s]}</span>
                      {isDone && <span className="text-xs text-slate-300 ml-auto">Done</span>}
                    </div>
                  );
                })}
              </div>
              
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div className="h-full bg-slate-900 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
              </div>
              <p className="text-xs text-slate-400 mt-2 text-right">{elapsed}s elapsed</p>
            </motion.div>
          )}
          {step === 4 && result && (
            <motion.div key="done" {...FADE} className="w-full max-w-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mx-auto mb-5"><Check className="w-7 h-7 text-emerald-600" /></div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-1">Clip ready</h2>
              <p className="text-sm text-slate-500 mb-1">{result.title}</p>
              <p className="text-xs text-slate-400 mb-6">{result.original_duration} → {result.clip_duration} · {result.reason}</p>
              <video controls src={result.output} className="w-full rounded-2xl mb-5 bg-black ring-1 ring-slate-200" />
              <div className="flex gap-3">
                <a href={result.output} download className="flex-1 py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-medium hover:bg-black transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download</a>
                <button onClick={() => { setStep(0); setResult(null); setUrl(''); setError(''); }} className="px-6 py-3.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">New</button>
              </div>
            </motion.div>
          )}
          {error && (
            <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-lg text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center mx-auto mb-5"><AlertCircle className="w-7 h-7 text-red-600" /></div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h2>
              <p className="text-sm text-slate-500 mb-6">{error}</p>
              <button onClick={() => { setError(''); setStep(0); }} className="px-8 py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-medium">Try again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
