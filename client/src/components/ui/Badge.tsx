import type { AssuranceStatut, OcrSource, DossierStatut, MissionStatut, PaiementStatut } from '../../types'

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'orange' | 'teal' | 'purple'

const VARIANTS: Record<Variant, string> = {
  success: 'bg-green-50  text-green-700  ring-1 ring-green-200',
  warning: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  danger:  'bg-red-50    text-red-600    ring-1 ring-red-200',
  info:    'bg-blue-50   text-blue-600   ring-1 ring-blue-200',
  neutral: 'bg-gray-100  text-gray-500   ring-1 ring-gray-200',
  orange:  'bg-orange-50 text-orange-600 ring-1 ring-orange-200',
  teal:    'bg-teal-50   text-teal-700   ring-1 ring-teal-200',
  purple:  'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
}

interface Props {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', children, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  )
}

// ── Badges métier ──────────────────────────────────────────────────────────

export function BadgeAssurance({ statut }: { statut?: AssuranceStatut | null }) {
  if (!statut) return <span className="text-[11px] text-gray-400">—</span>
  const MAP: Record<AssuranceStatut, [Variant, string]> = {
    DOCS_COLLECTES: ['info',    '📄 Docs collectés'],
    SOUMIS_LABO:    ['orange',  '🏥 Soumis au labo'],
    EN_VALIDATION:  ['warning', '⏳ En validation'],
    VALIDE_TOTAL:   ['success', '✅ Total'],
    VALIDE_PARTIEL: ['warning', '⚠️ Partiel'],
    REFUSE:         ['danger',  '❌ Refusé'],
  }
  const [v, label] = MAP[statut]
  return <Badge variant={v}>{label}</Badge>
}

export function BadgeOcr({ source }: { source?: OcrSource | null }) {
  if (!source) return null
  const MAP: Record<OcrSource, [Variant, string]> = {
    AUTO:   ['success', '🤖 OCR auto'],
    PATIENT:['info',    '✋ Patient'],
    AGENT:  ['orange',  '🏍️ Agent'],
    MANUAL: ['neutral', '✏️ Manuel'],
  }
  const [v, label] = MAP[source]
  return <Badge variant={v}>{label}</Badge>
}

export function BadgeDossier({ statut = 'INCONNU' }: { statut?: DossierStatut | string | null }) {
  if (!statut) return null
  const MAP: Record<string, [Variant, string]> = {
    EN_ATTENTE:            ['neutral', 'En attente'],
    PRET_PRELEVEMENT:      ['info',    'Prêt'],
    PRELEVEMENT_FAIT:      ['teal',    'Prélevé'],
    RESULTATS_EN_COURS:    ['purple',  'Résultats en cours'],
    RESULTATS_DISPONIBLES: ['success', 'Résultats dispo'],
    PAYE:                  ['success', 'Payé'],
    ARCHIVE:               ['neutral', 'Archivé'],
  }
  const entry = MAP[statut]
  if (!entry) return <Badge variant="neutral">{statut}</Badge>
  const [v, label] = entry
  return <Badge variant={v}>{label}</Badge>
}

export function BadgeMission({ statut }: { statut?: MissionStatut | string | null }) {
  if (!statut) return null
  const MAP: Record<string, [Variant, string]> = {
    PLANIFIEE:        ['info',    '📋 Planifiée'],
    EN_ROUTE:         ['orange',  '🏍️ En route'],
    ARRIVEE:          ['warning', '📍 Arrivée'],
    PRELEVEMENT_FAIT: ['teal',    '🧪 Prélevé'],
    TERMINEE:         ['success', '✅ Terminée'],
  }
  const entry = MAP[statut]
  if (!entry) return <Badge variant="neutral">{statut}</Badge>
  const [v, label] = entry
  return <Badge variant={v}>{label}</Badge>
}

export function BadgePaiement({ statut }: { statut?: PaiementStatut | string | null }) {
  if (!statut) return null
  const MAP: Record<string, [Variant, string]> = {
    EN_ATTENTE: ['warning', '⏳ En attente'],
    CONFIRME:   ['success', '✅ Confirmé'],
    ECHEC:      ['danger',  '❌ Échec'],
  }
  const entry = MAP[statut]
  if (!entry) return <Badge variant="neutral">{statut}</Badge>
  const [v, label] = entry
  return <Badge variant={v}>{label}</Badge>
}
