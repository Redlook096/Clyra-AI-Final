import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Loader2, Check, AlertCircle, Download, ChevronRight, ArrowLeft, Play, Flame, Laugh, Star, Sparkles, Zap, Target, Scissors, Type, Palette, Eye } from 'lucide-react';

interface Props { onClose: () => void }
type Step = 0 | 1 | 2 | 3 | 4;
type MomentType = 'viral' | 'funny' | 'dramatic' | 'inspiring' | 'surprising' | 'action' | '';

const MOMENTS: { id: MomentType; icon: typeof Flame; label: string; desc: string }[] = [
  { id: 'viral', icon: Flame, label: 'High Energy', desc: 'Most engaging moment' },
  { id: 'funny', icon: Laugh, label: 'Humorous', desc: 'Funniest segment' },
  { id: 'dramatic', icon: Star, label: 'Dramatic', desc: 'Emotional peak' },
  { id: 'inspiring', icon: Sparkles, label: 'Inspirational', desc: 'Motivational moment' },
  { id: 'surprising', icon: Zap, label: 'Surprising', desc: 'Unexpected twist' },
  { id: 'action', icon: Target, label: 'Action', desc: 'High intensity' },
];

const DEFAULTS = { font: 'Impact', fontSize: '52', colour: '#FFFFFF', position: 'bottom' as 'bottom' | 'centre' | 'top' };

export default function AIClipper({ onClose }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [url, setUrl] = useState('');
  const [moment, setMoment] = useState<MomentType>('viral');
  const [customMoment, setCustomMoment] = useState('');
  const [cfg, setCfg] = useState(DEFAULTS);
  const [clipName, setClipName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => { if (step !== 3) return; const i = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(i); }, [step]);

  const run = useCallback(async () => {
    setStep(3); setError(''); setResult(null); setElapsed(0);
    const effectiveMoment = customMoment.trim() || moment || 'viral';
    try {
      const res = await fetch('/api/clipper/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), config: { font: cfg.font, font_size: parseInt(cfg.fontSize), text_colour: cfg.colour, position: cfg.position, moment_type: effectiveMoment, clip_name: clipName.trim() || `clip-${Date.now()}` } })
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const reader = res.body?.getReader(); if (!reader) throw new Error('No stream');
      const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        for (const line of buf.split('\n')) { buf = buf.includes('\n') ? buf.split('\n').pop() || '' : '';
          const t = line.trim(); if (!t.startsWith('data: ')) continue;
          try { const ev = JSON.parse(t.slice(6));
            if (ev.type === 'error') throw new Error(ev.message);
            if (ev.type === 'progress') setStatus(ev.message || ev.step);
            if (ev.type === 'complete') { setResult(ev); setStep(4); return; }
          } catch(e) { if (e instanceof Error && e.message.includes('Pipeline')) throw e; }
        }
      }
    } catch(e: any) { setError(e.message); setStep(0); }
  }, [url, cfg, moment, customMoment, clipName]);

  const previewStyle = {
    fontFamily: cfg.font,
    fontSize: `${Math.min(parseInt(cfg.fontSize) * 0.5, 48)}px`,
    color: cfg.colour,
    textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
    fontWeight: 'bold',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-white flex flex-col">
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
        <h1 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Scissors className="w-4 h-4" /> AI Clip</h1>
        <div className="w-9" />
      </header>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* STEP 0: URL */}
          {step === 0 && (
            <motion.div key="url" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="w-full max-w-md text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5"><Youtube className="w-6 h-6 text-slate-700" /></div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Paste a YouTube link</h2>
              <p className="text-sm text-slate-500 mb-6">Find the best moment, add word-accurate subtitles</p>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtu.be/..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400 transition-all" autoFocus onKeyDown={e => e.key === 'Enter' && url.includes('youtu') && setStep(1)} />
              <button onClick={() => setStep(1)} disabled={!url.includes('youtu')} className="mt-3 w-full py-3 rounded-xl bg-black text-white text-sm font-medium disabled:opacity-30 transition-opacity">Continue <ChevronRight className="w-4 h-4 inline ml-1" /></button>
            </motion.div>
          )}

          {/* STEP 1: Moment Type */}
          {step === 1 && (
            <motion.div key="moment" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="w-full max-w-md">
              <h2 className="text-lg font-semibold text-slate-900 mb-1 text-center">What kind of moment?</h2>
              <p className="text-sm text-slate-500 mb-6 text-center">I'll scan the video to find it</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {MOMENTS.map(m => {
                  const Icon = m.icon;
                  const sel = moment === m.id && !customMoment.trim();
                  return (
                    <button key={m.id} onClick={() => { setMoment(m.id); setCustomMoment(''); }}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition-all duration-200 ${sel ? 'bg-black text-white border-black' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
                      <Icon className={`w-4 h-4 shrink-0 ${sel ? 'text-white' : 'text-slate-500'}`} />
                      <div><div className="text-sm font-medium">{m.label}</div><div className={`text-[10px] ${sel ? 'text-slate-300' : 'text-slate-400'}`}>{m.desc}</div></div>
                    </button>
                  );
                })}
              </div>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400">or</span></div>
              </div>
              <textarea value={customMoment} onChange={e => { setCustomMoment(e.target.value); if (e.target.value.trim()) setMoment(''); }}
                placeholder='Describe exactly what you want — "the part where they fall" or "the opening scene"...'
                rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all resize-none" />
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Back</button>
                <button onClick={() => setStep(2)} disabled={!moment && !customMoment.trim()} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-medium disabled:opacity-30 transition-opacity">Continue <ChevronRight className="w-4 h-4 inline ml-1" /></button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Subtitle Config */}
          {step === 2 && (
            <motion.div key="config" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="w-full max-w-lg">
              <div className="flex items-center gap-3 mb-5"><Type className="w-5 h-5 text-slate-700" /><h2 className="text-lg font-semibold text-slate-900">Subtitle style</h2></div>
              
              {/* Mock video preview */}
              <div className="relative aspect-video bg-slate-900 rounded-xl mb-6 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <Play className="w-10 h-10 text-white/40 absolute" />
                <div className={`absolute ${cfg.position === 'top' ? 'top-6' : cfg.position === 'centre' ? 'top-1/2 -translate-y-1/2' : 'bottom-6'} left-1/2 -translate-x-1/2 text-center pointer-events-none`}>
                  <span style={previewStyle}>SUBTITLES</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-500 w-16 shrink-0">Size</span>
                  <div className="flex gap-1.5 flex-1">
                    {[{l:'S',v:'36'},{l:'M',v:'52'},{l:'L',v:'68'}].map(o => (
                      <button key={o.v} onClick={() => setCfg({...cfg, fontSize: o.v})}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${cfg.fontSize===o.v ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{o.l}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-500 w-16 shrink-0">Font</span>
                  <select value={cfg.font} onChange={e => setCfg({...cfg, font: e.target.value})}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400">
                    {['Impact','Arial','Montserrat'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-500 w-16 shrink-0">Colour</span>
                  <input type="color" value={cfg.colour} onChange={e => setCfg({...cfg, colour: e.target.value})} className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer" />
                  <input value={cfg.colour} onChange={e => setCfg({...cfg, colour: e.target.value})} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-slate-400" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-500 w-16 shrink-0">Position</span>
                  <div className="flex gap-1.5 flex-1">
                    {[{l:'Bottom',v:'bottom'},{l:'Center',v:'centre'},{l:'Top',v:'top'}].map(o => (
                      <button key={o.v} onClick={() => setCfg({...cfg, position: o.v as "bottom" | "centre" | "top"})}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${cfg.position===o.v ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{o.l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <input value={clipName} onChange={e => setClipName(e.target.value)} placeholder="Clip name (optional)" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-slate-400 transition-all" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Back</button>
                <button onClick={run} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-medium hover:bg-slate-800 transition-all">Start Clipping</button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Processing */}
          {step === 3 && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} className="w-12 h-12 mx-auto mb-5">
                <Loader2 className="w-12 h-12 text-slate-700" />
              </motion.div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Creating your clip</h2>
              <p className="text-sm text-slate-500 mb-4">{status || 'Starting pipeline...'}</p>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-4">
                <motion.div className="h-full bg-black rounded-full" animate={{ width: ['0%', '30%', '60%', '85%', '100%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }} />
              </div>
              <p className="text-xs text-slate-400">{elapsed}s elapsed</p>
            </motion.div>
          )}

          {/* STEP 4: Result */}
          {step === 4 && result && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4"><Check className="w-6 h-6 text-emerald-600" /></div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Clip ready</h2>
              <p className="text-sm text-slate-500 mb-1">{result.title}</p>
              <p className="text-xs text-slate-400 mb-4">{result.original_duration} → {result.clip_duration} · {result.reason}</p>
              <video controls src={result.output?.replace('./output/','/output/')} className="w-full rounded-xl mb-5 bg-black" />
              <div className="flex gap-3">
                <a href={result.output?.replace('./output/','/output/')} download className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download</a>
                <button onClick={() => { setStep(0); setResult(null); setUrl(''); setError(''); }} className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">New</button>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-6 h-6 text-red-600" /></div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Error</h2>
              <p className="text-sm text-slate-500 mb-6">{error}</p>
              <button onClick={() => { setError(''); setStep(0); }} className="px-8 py-3 rounded-xl bg-black text-white text-sm font-medium">Try again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
