import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import { useDossierStore } from '../../store/dossierStore'
import { catalogueApi, ocrApi } from '../../services/api'
import type { ExamenCatalogue } from '../../types'
import {
  Upload, Camera, Scan, CheckCircle, X, Plus,
  Search, ChevronRight, Loader2,
} from 'lucide-react'

type Step = 'upload' | 'scanning' | 'correction'

export default function OCR() {
  const navigate     = useNavigate()
  const setBulletin  = useDossierStore(s => s.setBulletin)
  const setExamens   = useDossierStore(s => s.setExamens)
  const fileRef      = useRef<HTMLInputElement>(null)

  const [step, setStep]             = useState<Step>('upload')
  const [preview, setPreview]       = useState<string | null>(null)
  const [detected, setDetected]     = useState<ExamenCatalogue[]>([])
  const [catalogue, setCatalogue]   = useState<ExamenCatalogue[]>([])
  const [search, setSearch]         = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [scanProgress, setScanProg] = useState(0)

  useEffect(() => {
    catalogueApi.getAll().then(data => setCatalogue(data.examens ?? data ?? []))
  }, [])

  const handleFile = async (file: File) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    setBulletin(url, file)
    setStep('scanning')

    // Animate progress
    let prog = 0
    const interval = setInterval(() => {
      prog += Math.random() * 15
      if (prog >= 90) { clearInterval(interval); setScanProg(90) }
      else setScanProg(Math.round(prog))
    }, 150)

    try {
      const result = await ocrApi.analyserBulletin(file)
      clearInterval(interval)
      setScanProg(100)

      // Map result to catalogue objects
      const found: ExamenCatalogue[] = (result.examens ?? [])
        .map((code: string) => catalogue.find(c => c.code === code || c.nom.toLowerCase().includes(code.toLowerCase())))
        .filter(Boolean) as ExamenCatalogue[]

      setDetected(found)
      setTimeout(() => setStep('correction'), 500)
    } catch {
      clearInterval(interval)
      // Fallback: manual selection
      toast('OCR indisponible — sélectionnez vos examens manuellement', 'info')
      setDetected([])
      setStep('correction')
    }
  }

  const removeExam = (id: string) => setDetected(prev => prev.filter(e => e.id !== id))
  const addExam    = (exam: ExamenCatalogue) => {
    if (!detected.find(e => e.id === exam.id)) setDetected(prev => [...prev, exam])
    setShowAdd(false)
  }

  const handleNext = () => {
    if (detected.length === 0) { toast('Ajoutez au moins un examen', 'error'); return }
    setExamens(detected)
    navigate('/nouveau-dossier/assurance')
  }

  const filtered = catalogue
    .filter(e => e.actif)
    .filter(e => !detected.find(d => d.id === e.id))
    .filter(e =>
      search
        ? e.nom.toLowerCase().includes(search.toLowerCase()) || e.code.toLowerCase().includes(search.toLowerCase())
        : true
    )
    .slice(0, 20)

  /* ── Upload step ── */
  if (step === 'upload') return (
    <AppLayout noNav>
      <PageHeader title="Upload bulletin" subtitle="Parcours A — OCR automatique" back="/nouveau-dossier/parcours" />
      <div className="px-5 py-6 space-y-5">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[#D4E5E1] rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer hover:border-[#064D40]/50 hover:bg-[#064D40]/3 transition-colors"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#064D40]/8 flex items-center justify-center">
            <Upload size={28} className="text-[#064D40]" />
          </div>
          <div className="text-center">
            <p className="font-bold text-[#1A2B26]">Télécharger le bulletin</p>
            <p className="text-sm text-[#5C7A74] mt-1">Photo ou PDF · Max 10 Mo</p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <Button
          variant="outline"
          fullWidth
          onClick={() => { fileRef.current?.setAttribute('capture', 'environment'); fileRef.current?.click() }}
        >
          <Camera size={16} />
          Prendre une photo
        </Button>

        <div className="bg-[#064D40]/5 rounded-xl p-4">
          <p className="text-xs text-[#064D40] font-semibold flex items-center gap-2 mb-1">
            <Scan size={14} /> Analyse automatique
          </p>
          <p className="text-xs text-[#5C7A74]">
            Notre IA détectera automatiquement vos examens. Vous pourrez corriger le résultat.
          </p>
        </div>
      </div>
    </AppLayout>
  )

  /* ── Scanning step ── */
  if (step === 'scanning') return (
    <AppLayout noNav>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-8 gap-8">
        {/* Preview with scan line */}
        {preview && (
          <div className="relative w-64 h-80 rounded-2xl overflow-hidden shadow-lg">
            <img src={preview} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[#064D40]/20" />
            <div
              className="absolute left-0 right-0 h-0.5 bg-[#F4A726] shadow-[0_0_8px_#F4A726] ocr-scan-line"
              style={{ top: `${scanProgress}%` }}
            />
          </div>
        )}
        <div className="text-center space-y-3 w-full">
          <div className="flex items-center justify-center gap-2 text-[#064D40] font-bold">
            <Loader2 size={18} className="animate-spin" />
            Analyse en cours… {scanProgress}%
          </div>
          <div className="h-2 bg-[#D4E5E1] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#064D40] rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <p className="text-xs text-[#5C7A74]">Google Vision extrait vos examens…</p>
        </div>
      </div>
    </AppLayout>
  )

  /* ── Correction step ── */
  return (
    <AppLayout noNav>
      <PageHeader
        title="Vérification"
        subtitle={`${detected.length} examen(s) détecté(s)`}
        back={() => setStep('upload')}
      />

      <div className="px-5 py-4 space-y-4">
        {detected.length > 0 ? (
          <div className="bg-white rounded-2xl border border-[#D4E5E1] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#D4E5E1] flex items-center gap-2">
              <CheckCircle size={16} className="text-[#2CB67D]" />
              <span className="text-sm font-bold text-[#1A2B26]">Examens détectés</span>
            </div>
            {detected.map(exam => (
              <div key={exam.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#D4E5E1] last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1A2B26]">{exam.nom}</p>
                  <p className="text-xs text-[#5C7A74]">{exam.code} · {exam.tarifMax.toLocaleString()} XOF · {exam.typesTube}</p>
                </div>
                <button
                  onClick={() => removeExam(exam.id)}
                  className="w-7 h-7 rounded-full bg-red-50 text-[#E05C5C] flex items-center justify-center hover:bg-red-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#D4E5E1] p-6 text-center">
            <p className="text-sm text-[#5C7A74]">Aucun examen détecté. Ajoutez-en manuellement.</p>
          </div>
        )}

        {/* Ajouter */}
        <Button variant="outline" fullWidth onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} />
          Ajouter un examen
        </Button>

        {showAdd && (
          <div className="bg-white rounded-2xl border border-[#D4E5E1] overflow-hidden">
            <div className="p-3 border-b border-[#D4E5E1] relative">
              <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#5C7A74]" />
              <input
                type="text"
                placeholder="Rechercher un examen…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-[#D4E5E1] focus:outline-none focus:border-[#064D40]"
                autoFocus
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="text-center text-sm text-[#5C7A74] py-4">Aucun résultat</p>
              )}
              {filtered.map(exam => (
                <button
                  key={exam.id}
                  onClick={() => addExam(exam)}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-[#D4E5E1] last:border-0 hover:bg-[#f0f5f4] text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1A2B26]">{exam.nom}</p>
                    <p className="text-xs text-[#5C7A74]">{exam.code} · {exam.tarifMax.toLocaleString()} XOF</p>
                  </div>
                  <Plus size={16} className="text-[#064D40] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Récap tarif */}
        {detected.length > 0 && (
          <div className="bg-[#064D40]/5 rounded-xl p-4">
            <div className="flex justify-between text-sm font-semibold text-[#064D40]">
              <span>Total estimé</span>
              <span>{detected.reduce((s, e) => s + e.tarifMax, 0).toLocaleString()} XOF</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pb-8">
        <Button variant="primary" size="lg" fullWidth onClick={handleNext} disabled={detected.length === 0}>
          Continuer — Assurance
          <ChevronRight size={16} />
        </Button>
      </div>
    </AppLayout>
  )
}
