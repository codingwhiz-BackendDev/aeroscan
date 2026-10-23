'use client'

import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import {
  Camera,
  Check,
  Clipboard,
  FileImage,
  Fingerprint,
  Info,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
  Wifi,
  X,
} from 'lucide-react'

interface WifiDetails {
  ssid: string
  password: string
  security: string
  hidden: boolean
}

function parseWifiPayload(raw: string): WifiDetails | null {
  const match = raw.match(/^WIFI:(.*)$/i)
  if (!match) return null
  const fields: Record<string, string> = {}
  const body = match[1]
  const parts = body.match(/([TSAP]):((?:\\.|[^;])*)/g) ?? []
  for (const part of parts) {
    const key = part[0]
    fields[key] = part.slice(2).replace(/\\([\\;,:])/g, '$1')
  }
  return {
    ssid: fields.S ?? '',
    password: fields.P ?? '',
    security: fields.T === 'nopass' ? 'None' : fields.T === 'WEP' ? 'WEP' : 'WPA / WPA2',
    hidden: fields.H === 'true',
  }
}

export function WifiDecoder() {
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const [details, setDetails] = useState<WifiDetails | null>(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => () => { scannerRef.current?.stop() }, [])

  const decode = (value: string) => {
    const parsed = parseWifiPayload(value)
    if (parsed) { setDetails(parsed); setError(''); return true }
    setError('That QR code does not contain a Wi-Fi network.')
    return false
  }

  const handleFile = async (file?: File) => {
    if (!file) return
    try { decode(await QrScanner.scanImage(file) as string) }
    catch { setError('We could not find a QR code in that image. Try a clearer photo.') }
  }

  const toggleCamera = async () => {
    if (scanning) { scannerRef.current?.stop(); setScanning(false); return }
    if (!videoRef.current) return
    setError('')
    const scanner = new QrScanner(videoRef.current, result => {
      const value = typeof result === 'string' ? result : result.data
      if (decode(value)) { scanner.stop(); setScanning(false) }
    }, { highlightScanRegion: true, highlightCodeOutline: true })
    scannerRef.current = scanner
    try { await scanner.start(); setScanning(true) }
    catch { setError('Camera access was unavailable. You can upload an image instead.') }
  }

  const copyPassword = async () => {
    if (!details?.password) return
    await navigator.clipboard.writeText(details.password)
    setCopied(true); window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#0b0e16] text-slate-100 selection:bg-cyan-300 selection:text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(63,102,255,.24),transparent_42%),radial-gradient(circle_at_95%_65%,rgba(13,148,136,.12),transparent_32%)]" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-cyan-300 text-slate-950 shadow-[0_0_25px_rgba(103,232,249,.22)]"><Wifi size={20} strokeWidth={2.5} /></div><div><p className="text-[15px] font-semibold tracking-tight">Signal<span className="text-cyan-300">Decode</span></p><p className="text-[10px] uppercase tracking-[.22em] text-slate-500">Private by design</p></div></div>
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-[11px] text-slate-400 sm:flex"><ShieldCheck size={14} className="text-emerald-400" /> Nothing leaves your device</div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-16 pt-10 lg:px-10 lg:pt-16">
        <div className="mx-auto max-w-3xl text-center"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[.06] px-3 py-1.5 text-[11px] font-medium text-cyan-200"><Sparkles size={13} /> Instant network details</div><h1 className="text-4xl font-semibold tracking-[-.04em] text-white sm:text-6xl">Decode any Wi-Fi QR code.</h1><p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">Scan or upload a QR code to reveal the network name, security type, and password — instantly and privately.</p></div>

        <section className="mx-auto mt-12 grid max-w-4xl gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[26px] border border-white/10 bg-white/[.045] p-2 shadow-2xl shadow-black/20 backdrop-blur-xl"><div className="relative flex min-h-[310px] flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-cyan-200/20 bg-[#0d121e] px-6 py-10 text-center"><div className="absolute inset-0 bg-[linear-gradient(rgba(103,232,249,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.03)_1px,transparent_1px)] bg-[size:28px_28px]" />{scanning ? <><video ref={videoRef} className="absolute inset-0 size-full object-cover" muted playsInline /><div className="absolute inset-8 rounded-2xl border border-cyan-300/70 shadow-[0_0_35px_rgba(103,232,249,.2)]" /><button onClick={toggleCamera} className="relative z-10 mt-48 rounded-full bg-slate-950/80 px-4 py-2 text-xs text-white ring-1 ring-white/15"><X size={14} className="mr-1 inline" /> Stop camera</button></> : <><div className="relative mb-5 grid size-16 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-300 ring-1 ring-cyan-300/20"><ScanLine size={30} strokeWidth={1.5} /></div><h2 className="relative text-lg font-medium text-white">Drop a QR image here</h2><p className="relative mt-2 text-xs text-slate-500">PNG, JPG, or WEBP · processed locally</p><div className="relative mt-7 flex flex-wrap justify-center gap-3"><button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-200"><Upload size={15} /> Upload image</button><button onClick={toggleCamera} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"><Camera size={15} /> Use camera</button></div><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} /></>}</div></div>
          <div className="rounded-[26px] border border-white/10 bg-white/[.045] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"><div className="mb-7 flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[.16em] text-slate-500">Decoded details</p><h2 className="mt-1 text-lg font-medium text-white">{details ? 'Network found' : 'Waiting to scan'}</h2></div>{details ? <div className="grid size-9 place-items-center rounded-full bg-emerald-400/10 text-emerald-400"><Check size={18} /></div> : <div className="grid size-9 place-items-center rounded-full bg-white/5 text-slate-600"><LockKeyhole size={16} /></div>}</div>{details ? <div className="space-y-4"><Detail label="Network name" value={details.ssid} icon={<Wifi size={15} />} /><div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.05] p-4"><div className="mb-2 flex items-center justify-between"><span className="text-[11px] text-slate-500">Password</span><button onClick={copyPassword} className="text-cyan-300 transition hover:text-cyan-200" aria-label="Copy password">{copied ? <Check size={15} /> : <Clipboard size={15} />}</button></div><p className="break-all font-mono text-sm text-cyan-100">{details.password || 'No password'}</p></div><div className="grid grid-cols-2 gap-3"><Detail label="Security" value={details.security} icon={<ShieldCheck size={15} />} /><Detail label="Visibility" value={details.hidden ? 'Hidden' : 'Visible'} icon={<Fingerprint size={15} />} /></div><button onClick={() => setDetails(null)} className="mt-2 w-full rounded-xl border border-white/10 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/[.06]">Scan another code</button></div> : <div className="flex min-h-[198px] flex-col items-center justify-center text-center"><div className="mb-4 grid size-12 place-items-center rounded-full bg-white/[.04] text-slate-600"><FileImage size={20} /></div><p className="text-sm text-slate-400">Your results will appear here</p><p className="mt-2 max-w-[210px] text-xs leading-5 text-slate-600">We support standard Wi-Fi QR codes from phones, routers, and printouts.</p></div>}{error && <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[.06] p-3 text-xs leading-5 text-rose-200"><Info size={15} className="mt-0.5 shrink-0" />{error}</div>}</div>
        </section>
        <div className="mx-auto mt-7 flex max-w-4xl flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[11px] text-slate-500"><span className="inline-flex items-center gap-2"><LockKeyhole size={13} className="text-slate-400" /> No uploads</span><span className="inline-flex items-center gap-2"><ShieldCheck size={13} className="text-slate-400" /> No tracking</span><span className="inline-flex items-center gap-2"><Fingerprint size={13} className="text-slate-400" /> Works offline</span></div>
      </main>
      <footer className="relative mx-auto flex max-w-6xl justify-between border-t border-white/[.06] px-6 py-5 text-[10px] text-slate-600 lg:px-10"><span>SignalDecode · A private utility</span><span>Built for clarity</span></footer>
    </div>
  )
}

function Detail({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="mb-2 flex items-center gap-2 text-slate-500">{icon}<span className="text-[11px]">{label}</span></div><p className="truncate text-sm text-slate-200">{value || 'Unknown'}</p></div> }
