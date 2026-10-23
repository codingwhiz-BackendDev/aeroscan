'use client'

import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { Camera, Check, Clipboard, FileImage, Fingerprint, LockKeyhole, ScanLine, ShieldCheck, Upload, Wifi, X } from 'lucide-react'

interface WifiDetails { ssid: string; password: string; security: string; hidden: boolean }

function parseWifiPayload(raw: string): WifiDetails | null {
  const match = raw.match(/^WIFI:(.*)$/i)
  if (!match) return null
  const fields: Record<string, string> = {}
  for (const part of match[1].match(/([TSAP]):((?:\\.|[^;])*)/g) ?? []) fields[part[0]] = part.slice(2).replace(/\\([\\;,:])/g, '$1')
  return { ssid: fields.S ?? '', password: fields.P ?? '', security: fields.T === 'nopass' ? 'None' : fields.T === 'WEP' ? 'WEP' : 'WPA / WPA2', hidden: fields.H === 'true' }
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

  const decode = (value: string) => { const parsed = parseWifiPayload(value); if (parsed) { setDetails(parsed); setError(''); return true }; setError('This code is not a Wi-Fi network QR.'); return false }
  const handleFile = async (file?: File) => { if (!file) return; try { decode(await QrScanner.scanImage(file) as string) } catch { setError('No QR code found. Try a sharper, well-lit image.') } }
  const toggleCamera = async () => {
    if (scanning) { scannerRef.current?.stop(); setScanning(false); return }
    if (!videoRef.current) return
    setError('')
    const scanner = new QrScanner(videoRef.current, result => { const value = typeof result === 'string' ? result : result.data; if (decode(value)) { scanner.stop(); setScanning(false) } }, { highlightScanRegion: true, highlightCodeOutline: true })
    scannerRef.current = scanner
    try { await scanner.start(); setScanning(true) } catch { setError('Camera access is unavailable. Upload an image instead.') }
  }
  const copyPassword = async () => { if (!details?.password) return; await navigator.clipboard.writeText(details.password); setCopied(true); window.setTimeout(() => setCopied(false), 1800) }

  return <div className="min-h-screen bg-[#f5f3ee] text-[#18212d] selection:bg-[#b9d7ff]">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-12">
      <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-[#174c8f] text-white"><Wifi size={18} /></div><div><p className="font-mono text-[13px] font-bold tracking-[.18em] text-[#174c8f]">AEROSCAN</p><p className="mt-0.5 text-[10px] uppercase tracking-[.16em] text-[#718096]">Private signal utility</p></div></div>
      <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-[#718096] sm:flex"><span className="size-1.5 rounded-full bg-[#2d9b71]" /> Local processing only</div>
    </header>

    <main className="mx-auto max-w-7xl px-6 pb-14 lg:px-12">
      <div className="grid gap-12 border-t border-[#d8d6d0] pt-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-20 lg:pt-20">
        <div><p className="mb-7 font-mono text-[11px] uppercase tracking-[.2em] text-[#174c8f]">01 / Network access</p><h1 className="max-w-xl text-5xl font-medium leading-[.95] tracking-[-.055em] text-[#17202c] sm:text-7xl">A clearer way to connect.</h1><p className="mt-7 max-w-md text-[15px] leading-7 text-[#687383]">Read the details inside a Wi-Fi QR code. Fast, private, and designed to keep the password visible only to you.</p><div className="mt-12 grid max-w-sm grid-cols-2 gap-6 border-t border-[#d8d6d0] pt-5 text-[11px] text-[#718096]"><div><p className="font-mono text-[#174c8f]">01</p><p className="mt-2">Upload or scan</p></div><div><p className="font-mono text-[#174c8f]">02</p><p className="mt-2">Reveal securely</p></div></div></div>
        <section className="grid gap-4 sm:grid-cols-[1.1fr_.9fr]">
          <div className="border border-[#ccd2da] bg-white p-2 shadow-[0_18px_50px_rgba(33,53,76,.08)]"><div className="relative flex min-h-[365px] flex-col items-center justify-center overflow-hidden border border-dashed border-[#b9c3cf] bg-[#f8fafc] px-6 text-center">{scanning ? <><video ref={videoRef} className="absolute inset-0 size-full object-cover" muted playsInline /><div className="absolute inset-8 border border-white shadow-[0_0_0_999px_rgba(14,35,61,.18)]" /><button onClick={toggleCamera} className="relative z-10 mt-64 inline-flex items-center gap-2 bg-[#17202c] px-4 py-2 text-xs text-white"><X size={14} /> Stop camera</button></> : <><div className="mb-7 grid size-14 place-items-center rounded-full bg-[#e5effb] text-[#174c8f]"><ScanLine size={27} strokeWidth={1.5} /></div><h2 className="text-lg font-medium tracking-[-.02em]">Place your QR code here</h2><p className="mt-2 text-xs text-[#8a95a3]">PNG, JPG, or WEBP · decoded in your browser</p><div className="mt-8 flex flex-wrap justify-center gap-2"><button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 bg-[#174c8f] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#0f3c72]"><Upload size={14} /> Upload image</button><button onClick={toggleCamera} className="inline-flex items-center gap-2 border border-[#cbd3dd] bg-white px-4 py-3 text-xs font-medium text-[#334155] transition hover:border-[#174c8f]"><Camera size={14} /> Camera</button></div><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} /></>}</div></div>
          <div className="border border-[#ccd2da] bg-[#17202c] p-5 text-white"><div className="flex items-start justify-between border-b border-white/10 pb-5"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#93a4b8]">Decoded details</p><h2 className="mt-2 text-lg font-medium">{details ? 'Network found' : 'Awaiting scan'}</h2></div><div className="grid size-8 place-items-center rounded-full bg-white/10 text-[#9bc8ff]">{details ? <Check size={15} /> : <LockKeyhole size={14} />}</div></div>{details ? <div className="space-y-4 pt-5"><Detail label="Network name" value={details.ssid} icon={<Wifi size={14} />} dark /><div className="border border-[#386995] bg-[#203b59] p-4"><div className="mb-2 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.14em] text-[#9eb8d3]">Password</span><button onClick={copyPassword} aria-label="Copy password" className="text-[#9bc8ff]">{copied ? <Check size={15} /> : <Clipboard size={15} />}</button></div><p className="break-all font-mono text-sm text-[#e2efff]">{details.password || 'No password'}</p></div><div className="grid grid-cols-2 gap-2"><Detail label="Security" value={details.security} icon={<ShieldCheck size={14} />} dark /><Detail label="Visibility" value={details.hidden ? 'Hidden' : 'Visible'} icon={<Fingerprint size={14} />} dark /></div><button onClick={() => setDetails(null)} className="mt-2 w-full border border-white/15 py-2.5 text-xs text-[#c6d2df] transition hover:bg-white/10">Scan another code</button></div> : <div className="flex min-h-[220px] flex-col items-center justify-center text-center"><FileImage size={23} className="mb-4 text-[#6d8095]" /><p className="text-sm text-[#c6d2df]">Your results will appear here</p><p className="mt-2 max-w-[180px] text-xs leading-5 text-[#8191a3]">A network name, security type, and password.</p></div>}</div>
        </section>
      </div>
      {error && <p role="alert" className="mt-5 text-center text-xs text-[#b33b3b]">{error}</p>}
      <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-[#d8d6d0] pt-5 font-mono text-[10px] uppercase tracking-[.12em] text-[#8993a0]"><span className="inline-flex items-center gap-2"><ShieldCheck size={13} /> No uploads</span><span className="inline-flex items-center gap-2"><LockKeyhole size={13} /> No tracking</span><span className="inline-flex items-center gap-2"><Fingerprint size={13} /> Works offline</span></div>
    </main><footer className="mx-auto flex max-w-7xl justify-between border-t border-[#d8d6d0] px-6 py-6 font-mono text-[10px] uppercase tracking-[.12em] text-[#9aa1a9] lg:px-12"><span>AeroScan / 2026</span><span>Built for clarity</span></footer>
  </div>
}

function Detail({ label, value, icon, dark = false }: { label: string; value: string; icon: React.ReactNode; dark?: boolean }) { return <div className={`border p-3 ${dark ? 'border-white/10 bg-white/[.04]' : 'border-[#d9e0e8] bg-white'}`}><div className={`mb-2 flex items-center gap-2 ${dark ? 'text-[#8ea4ba]' : 'text-[#8793a1]'}`}><span>{icon}</span><span className="font-mono text-[10px] uppercase tracking-[.12em]">{label}</span></div><p className={`truncate text-sm ${dark ? 'text-white' : 'text-[#334155]'}`}>{value || 'Unknown'}</p></div> }
