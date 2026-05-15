import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Loader2, Check, AlertCircle, Download, Video, ChevronRight, ArrowLeft, Play } from 'lucide-react';

interface Props { onClose: () => void }
type Step = 0 | 1 | 2 | 3;

const DEFAULTS = { font: 'Impact', fontSize: '52', colour: '#FFFFFF', position: 'bottom' };

export default function AIClipper({ onClose }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [url, setUrl] = useState('');
  const [cfg, setCfg] = useState(DEFAULTS);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (step !== 2) return;
    const i = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(i);
  }, [step]);

  const run = useCallback(async () => {
    setStep(2); setError(''); setResult(null); setElapsed(0);
    try {
      const res = await fetch('/api/clipper/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), config: { font: cfg.font, font_size: parseInt(cfg.fontSize), text_colour: cfg.colour, position: cfg.position, moment_type: 'viral', clip_name: `clip-${Date.now()}` } })
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const reader = res.body?.getReader(); if (!reader) throw new Error('No stream');
      const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        for (const line of buf.split('\n')) {
          buf = buf.includes('\n') ? buf.split('\n').pop() || '' : '';
          const t = line.trim(); if (!t.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(t.slice(6));
            if (ev.type === 'error') throw new Error(ev.message);
            if (ev.type === 'progress') setStatus(ev.message || ev.step);
            if (ev.type === 'complete') { setResult(ev); setStep(3); return; }
          } catch (e) { if (e instanceof Error && e.message.includes('Pipeline')) throw e; }
        }
      }
    } catch (e: any) { setError(e.message); setStep(0); }
  }, [url, cfg]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <button onClick={onClose} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
        <h1 className="text-base font-semibold text-slate-900">AI Clip</h1>
        <div className="w-9" />
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="url" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full max-w-md text-center">
              <Youtube className="w-10 h-10 text-slate-800 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Paste a YouTube link</h2>
              <p className="text-sm text-slate-500 mb-6">I'll find the best moment and add subtitles</p>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtu.be/..." className="w-full px-5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" autoFocus onKeyDown={e => e.key === 'Enter' && url.includes('youtu') && setStep(1)} />
              <button onClick={() => setStep(1)} disabled={!url.includes('youtu')} className="mt-4 w-full py-3 rounded-xl bg-black text-white text-sm font-medium disabled:opacity-30 transition-opacity">Continue</button>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="config" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full max-w-md">
              <h2 className="text-lg font-semibold text-slate-900 mb-6 text-center">Subtitle settings</h2>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-2 block">Font size</label>
                  <div className="flex gap-2">{[{l:'S',v:'36'},{l:'M',v:'52'},{l:'L',v:'68'}].map(o => (
                    <button key={o.v} onClick={() => setCfg({...cfg, fontSize: o.v})} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${cfg.fontSize===o.v?'bg-black text-white border-black':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{o.l} ({o.v}px)</button>
                  ))}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-2 block">Font</label>
                  <select value={cfg.font} onChange={e => setCfg({...cfg, font: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-slate-400">
                    {['Impact','Arial','Montserrat'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-2 block">Text colour</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={cfg.colour} onChange={e => setCfg({...cfg, colour: e.target.value})} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                    <input value={cfg.colour} onChange={e => setCfg({...cfg, colour: e.target.value})} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-2 block">Position</label>
                  <div className="flex gap-2">{[{l:'Bottom',v:'bottom'},{l:'Center',v:'centre'},{l:'Top',v:'top'}].map(o => (
                    <button key={o.v} onClick={() => setCfg({...cfg, position: o.v})} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${cfg.position===o.v?'bg-black text-white border-black':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{o.l}</button>
                  ))}</div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Back</button>
                <button onClick={run} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-medium hover:bg-slate-800 transition-all">Start Clipping</button>
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md text-center">
              <Loader2 className="w-10 h-10 text-slate-800 mx-auto mb-4 animate-spin" />
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Processing...</h2>
              <p className="text-sm text-slate-500 mb-4">{status || 'Starting pipeline...'}</p>
              <p className="text-xs text-slate-400">Elapsed: {elapsed}s</p>
            </motion.div>
          )}
          {step === 3 && result && (
            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4"><Check className="w-7 h-7 text-emerald-600" /></div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Clip ready!</h2>
              <p className="text-sm text-slate-500 mb-2">{result.title}</p>
              <p className="text-xs text-slate-400 mb-1">{result.original_duration} → {result.clip_duration}</p>
              <p className="text-xs text-slate-400 mb-6">{result.font} {result.font_size}px · {result.reason}</p>
              <video controls src={result.output?.replace('./output/','/output/')} className="w-full rounded-xl mb-6 bg-black" />
              <div className="flex gap-3">
                <a href={result.output?.replace('./output/','/output/')} download className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download</a>
                <button onClick={() => { setStep(0); setResult(null); setError(''); setUrl(''); }} className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">New</button>
              </div>
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-7 h-7 text-red-600" /></div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h2>
              <p className="text-sm text-slate-500 mb-6">{error}</p>
              <button onClick={() => { setError(''); setStep(0); }} className="px-8 py-3 rounded-xl bg-black text-white text-sm font-medium">Try again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
