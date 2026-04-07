/**
 * AddressAutocomplete.tsx
 *
 * Composant d'autocomplétion d'adresse style Uber/Yango avec carte Leaflet intégrée.
 * Suggestions à partir de 3 caractères, debounce 300 ms.
 *
 * ─── Carte : approche crosshair ───────────────────────────────────────────────
 *   Après sélection d'une suggestion, une carte 220 px apparaît avec un viseur
 *   fixe au centre. L'utilisateur déplace la CARTE sous le viseur (comme Uber).
 *   Sur moveend, un reverse geocoding Nominatim est déclenché sur le centre.
 *
 * ─── CSS Leaflet ──────────────────────────────────────────────────────────────
 *   Importé dans main.tsx (import 'leaflet/dist/leaflet.css').
 *
 * ─── Provider par défaut : Nominatim OSM ─────────────────────────────────────
 *   Gratuit, sans clé API.
 *   .env : VITE_GEOCODING_PROVIDER=nominatim  (ou omis — c'est le défaut)
 *
 * ─── Switcher vers Google Places ─────────────────────────────────────────────
 *   1. .env : VITE_GEOCODING_PROVIDER=google
 *   2. .env : VITE_GOOGLE_PLACES_KEY=AIzaSy_votre_cle
 *   3. Charger le SDK dans index.html (avant </body>) :
 *        <script src="https://maps.googleapis.com/maps/api/js
 *                     ?key=%VITE_GOOGLE_PLACES_KEY%
 *                     &libraries=places&language=fr"></script>
 *
 * ─── Props ───────────────────────────────────────────────────────────────────
 *   value           — valeur contrôlée du champ texte
 *   onChange        — appelé à chaque frappe (string)
 *   onSelect        — appelé quand une suggestion est choisie (adresse, commune)
 *   placeholder     — texte placeholder (optionnel)
 *   communes        — liste des communes pour la détection automatique
 *   selectedCommune — commune sélectionnée dans le dropdown parent ;
 *                     scope la recherche via viewbox + bounded=1 + nom dans la query
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import L from 'leaflet'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Suggestion {
  label: string
  sublabel: string
  adresse: string
  commune: string
  lat: number
  lng: number
}

export interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (adresse: string, commune: string) => void
  placeholder?: string
  communes?: string[]
  selectedCommune?: string
}

// ─── Carte : constantes ───────────────────────────────────────────────────────

const ABIDJAN_CENTER: [number, number] = [5.3484, -4.0083]

const COMMUNE_BBOX: Record<string, string> = {
  Yopougon:     '-4.12,5.45,-3.97,5.30',
  Cocody:       '-3.98,5.42,-3.87,5.30',
  Abobo:        '-4.08,5.52,-3.96,5.37',
  Attécoubé:    '-4.05,5.38,-3.99,5.31',
  Plateau:      '-4.01,5.34,-3.96,5.30',
  Marcory:      '-4.00,5.32,-3.92,5.26',
  Treichville:  '-4.00,5.31,-3.96,5.27',
  Adjamé:       '-4.03,5.38,-3.97,5.34',
  Koumassi:     '-3.98,5.32,-3.91,5.26',
  'Port-Bouët': '-3.97,5.30,-3.86,5.22',
}

// ─── Nominatim helpers ────────────────────────────────────────────────────────

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  address?: {
    city_district?: string
    suburb?: string
    neighbourhood?: string
    quarter?: string
    road?: string
    house_number?: string
  }
}

function detectCommune(addr: NominatimResult['address'] = {}, communes: string[]): string {
  for (const c of [addr.city_district, addr.suburb, addr.neighbourhood, addr.quarter]) {
    if (!c) continue
    const lower = c.toLowerCase()
    const match = communes.find(k => lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower))
    if (match) return match
  }
  return ''
}

async function searchNominatim(
  query: string,
  communes: string[],
  selectedCommune?: string,
): Promise<Suggestion[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', selectedCommune
    ? `${query}, ${selectedCommune}, Abidjan, Côte d'Ivoire`
    : `${query}, Abidjan, Côte d'Ivoire`)
  url.searchParams.set('countrycodes', 'ci')
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '6')
  url.searchParams.set('accept-language', 'fr')
  url.searchParams.set('addressdetails', '1')
  const bbox = selectedCommune ? COMMUNE_BBOX[selectedCommune] : undefined
  if (bbox) { url.searchParams.set('viewbox', bbox); url.searchParams.set('bounded', '1') }

  const res  = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  const data: NominatimResult[] = await res.json()

  return data.map(item => {
    const parts    = item.display_name.split(',')
    const label    = parts[0].trim()
    const sublabel = parts.slice(1, 4).join(',').trim()
    const commune  = detectCommune(item.address, communes)
    const adresse  = parts
      .filter(p => !p.trim().match(/^(Côte d'Ivoire|Ivory Coast|CI)$/i))
      .slice(0, 4).join(',').trim()
    return { label, sublabel, adresse, commune, lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
  })
}

async function reverseGeocode(lat: number, lng: number, communes: string[]) {
  const res  = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr&addressdetails=1`,
    { headers: { Accept: 'application/json' } },
  )
  const data = await res.json()
  const addr = data.address ?? {}
  const commune = detectCommune(addr, communes)
  const parts   = [addr.house_number, addr.road, addr.neighbourhood].filter(Boolean)
  const adresse = parts.length > 0
    ? parts.join(', ')
    : (data.display_name ?? '').split(',').slice(0, 3).join(',').trim()
  return { adresse, commune }
}

// ─── Google Places stub ───────────────────────────────────────────────────────

async function searchGoogle(query: string, communes: string[], selectedCommune?: string): Promise<Suggestion[]> {
  const g = (window as unknown as { google?: { maps?: { places?: { AutocompleteService?: unknown } } } }).google
  if (!g?.maps?.places?.AutocompleteService) {
    console.warn('[AddressAutocomplete] Google Places SDK non chargé.')
    return []
  }
  const svc = new (g.maps.places as { AutocompleteService: new () => {
    getPlacePredictions: (req: { input: string; componentRestrictions: { country: string }; language: string },
      cb: (r: Array<{ description: string; structured_formatting: { main_text: string; secondary_text: string } }> | null, s: string) => void) => void
  } }).AutocompleteService()
  return new Promise(resolve => {
    svc.getPlacePredictions(
      { input: selectedCommune ? `${query} ${selectedCommune}` : query, componentRestrictions: { country: 'ci' }, language: 'fr' },
      (results, status) => {
        if (status !== 'OK' || !results) { resolve([]); return }
        resolve(results.map(r => ({
          label: r.structured_formatting.main_text,
          sublabel: r.structured_formatting.secondary_text,
          adresse: r.description,
          commune: communes.find(c => r.description.toLowerCase().includes(c.toLowerCase())) ?? '',
          lat: ABIDJAN_CENTER[0], lng: ABIDJAN_CENTER[1],
        })))
      }
    )
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

const DEFAULT_COMMUNES = [
  'Yopougon', 'Cocody', 'Abobo', 'Attécoubé', 'Plateau',
  'Marcory', 'Treichville', 'Adjamé', 'Koumassi', 'Port-Bouët',
]

const PROVIDER = (import.meta.env.VITE_GEOCODING_PROVIDER as string | undefined) ?? 'nominatim'

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Numéro, rue, quartier…',
  communes = DEFAULT_COMMUNES,
  selectedCommune,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading]         = useState(false)
  const [open, setOpen]               = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [showMap, setShowMap]         = useState(false)
  const [mapPos, setMapPos]           = useState<[number, number]>(ABIDJAN_CENTER)
  const [reversing, setReversing]     = useState(false)
  const [moving, setMoving]           = useState(false) // carte en cours de déplacement

  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef  = useRef<HTMLDivElement>(null)
  const inputRef      = useRef<HTMLInputElement>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const mapPosRef     = useRef<[number, number]>(ABIDJAN_CENTER)

  // Stable refs so moveend always gets the latest callbacks
  const onSelectRef = useRef(onSelect)
  const onChangeRef = useRef(onChange)
  const communesRef = useRef(communes)
  useEffect(() => { onSelectRef.current = onSelect  }, [onSelect])
  useEffect(() => { onChangeRef.current = onChange  }, [onChange])
  useEffect(() => { communesRef.current = communes  }, [communes])
  useEffect(() => { mapPosRef.current   = mapPos    }, [mapPos])

  // ── Callback ref: fires the instant the map div mounts/unmounts ─────────────
  const mapContainerCb = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      leafletMapRef.current?.remove()
      leafletMapRef.current = null
      return
    }

    const pos = mapPosRef.current
    const map = L.map(node, {
      center: pos,
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.control.attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('© <a href="https://osm.org/copyright" target="_blank">OSM</a>')
      .addTo(map)

    // Crosshair approach: la carte se déplace sous le viseur fixe.
    // movestart → le pin "décolle" (animation CSS), moveend → reverse geocoding.
    map.on('movestart', () => setMoving(true))
    map.on('moveend', async () => {
      setMoving(false)
      const { lat, lng } = map.getCenter()
      setReversing(true)
      try {
        const result = await reverseGeocode(lat, lng, communesRef.current)
        onChangeRef.current(result.adresse)
        onSelectRef.current(result.adresse, result.commune)
      } finally {
        setReversing(false)
      }
    })

    leafletMapRef.current = map

    requestAnimationFrame(() => { map.invalidateSize(); map.setView(pos, 16) })
  }, []) // empty deps — only fires on DOM mount/unmount

  // ── Centre la carte sur mapPos quand la position change (ex: sélection suggestion) ──
  useEffect(() => {
    if (!leafletMapRef.current) return
    leafletMapRef.current.setView(mapPos, 16, { animate: true })
  }, [mapPos])

  // ── Close dropdown on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Re-search when selectedCommune changes ───────────────────────────────────
  useEffect(() => {
    if (value.trim().length >= 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => search(value), 300)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCommune])

  // ── Debounced search ─────────────────────────────────────────────────────────
  const search = useCallback(async (query: string) => {
    if (query.trim().length < 3) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    try {
      const results = PROVIDER === 'google'
        ? await searchGoogle(query, communes, selectedCommune)
        : await searchNominatim(query, communes, selectedCommune)
      setSuggestions(results)
      setOpen(results.length > 0)
      setActiveIndex(-1)
    } catch {
      setSuggestions([]); setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [communes, selectedCommune])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    onChange(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 300)
  }

  const handleSelect = (s: Suggestion) => {
    onChange(s.adresse)
    onSelect(s.adresse, s.commune)
    setSuggestions([])
    setOpen(false)
    setMapPos([s.lat, s.lng])
    setShowMap(true)
  }

  const handleClear = () => {
    onChange('')
    setSuggestions([])
    setOpen(false)
    setShowMap(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if      (e.key === 'ArrowDown')                    { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp')                      { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && activeIndex >= 0)    { e.preventDefault(); handleSelect(suggestions[activeIndex]) }
    else if (e.key === 'Escape')                       { setOpen(false); setActiveIndex(-1) }
  }

  return (
    <div ref={containerRef} className="relative">

      {/* ── Input ── */}
      <div className="relative">
        <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#064D40] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-9 pr-9 py-3 rounded-xl border border-[#D4E5E1] text-sm focus:outline-none focus:border-[#064D40] text-[#1A2B26] placeholder:text-[#5C7A74] transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading
            ? <Loader2 size={14} className="text-[#5C7A74] animate-spin" />
            : value
              ? <button onClick={handleClear} className="text-[#5C7A74] hover:text-[#1A2B26]"><X size={14} /></button>
              : null}
        </div>
      </div>

      {/* ── Dropdown ── */}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#D4E5E1] rounded-2xl shadow-xl overflow-hidden z-50">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleSelect(s)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-[#D4E5E1] last:border-0
                ${i === activeIndex ? 'bg-[#064D40]/5' : 'hover:bg-[#F5F7F6]'}`}
            >
              <div className="w-7 h-7 rounded-full bg-[#064D40]/10 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={13} className="text-[#064D40]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A2B26] truncate">{s.label}</p>
                {s.sublabel && <p className="text-xs text-[#5C7A74] truncate mt-0.5">{s.sublabel}</p>}
                {s.commune  && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-[#064D40] bg-[#064D40]/10 px-1.5 py-0.5 rounded">
                    {s.commune}
                  </span>
                )}
              </div>
            </button>
          ))}
          <div className="px-4 py-2 flex items-center justify-between bg-[#F5F7F6]">
            {selectedCommune
              ? <span className="text-[10px] font-semibold text-[#064D40]">📍 Scopé sur {selectedCommune}</span>
              : <span />}
            <span className="text-[10px] font-bold text-[#5C7A74]">
              {PROVIDER === 'google' ? 'Google Maps' : 'OpenStreetMap'}
            </span>
          </div>
        </div>
      )}

      {/* ── Leaflet map avec crosshair fixe ── */}
      {showMap && (
        <div className="mt-2 rounded-2xl overflow-hidden border border-[#D4E5E1] shadow-sm relative">
          {/* Tuiles Leaflet */}
          <div ref={mapContainerCb} style={{ height: 220 }} />

          {/* ── Viseur fixe au centre (style Uber) ── */}
          {/* Ombre au sol : s'agrandit quand le pin "décolle" */}
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none z-[500] rounded-full bg-black/25"
            style={{
              transform:  'translate(-50%, -50%)',
              width:       moving ? 14 : 8,
              height:      moving ? 5  : 3,
              transition:  'all 150ms ease',
            }}
          />
          {/* Pin SVG : se soulève pendant le déplacement de la carte */}
          <div
            className="absolute left-1/2 pointer-events-none z-[500]"
            style={{
              top:        '50%',
              transform:  moving
                ? 'translate(-50%, calc(-100% - 10px))'
                : 'translate(-50%, -100%)',
              transition: 'transform 150ms ease',
              filter:     'drop-shadow(0 4px 8px rgba(0,0,0,.4))',
            }}
          >
            <svg width="38" height="50" viewBox="0 0 38 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 0C12.096 0 6.5 5.596 6.5 12.5c0 9.5 12.5 25 12.5 25s12.5-15.5 12.5-25C31.5 5.596 25.904 0 19 0z" fill="#064D40"/>
              <circle cx="19" cy="12.5" r="6" fill="white"/>
            </svg>
          </div>

          {/* Spinner reverse geocoding */}
          {reversing && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[1000]">
              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow border border-[#D4E5E1]">
                <Loader2 size={14} className="text-[#064D40] animate-spin" />
                <span className="text-xs font-semibold text-[#064D40]">Mise à jour…</span>
              </div>
            </div>
          )}

          {/* Instruction */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="flex items-center gap-1.5 bg-white/95 rounded-xl px-3 py-1.5 shadow border border-[#D4E5E1] whitespace-nowrap">
              <span className="text-sm leading-none">🗺️</span>
              <span className="text-xs font-semibold text-[#1A2B26]">Déplacez la carte pour ajuster</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
