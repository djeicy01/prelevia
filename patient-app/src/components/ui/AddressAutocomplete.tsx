/**
 * AddressAutocomplete.tsx
 *
 * Composant d'autocomplétion d'adresse style Uber/Yango avec carte Leaflet intégrée.
 * Suggestions à partir de 3 caractères, debounce 300 ms.
 * Après sélection d'une suggestion, une carte de 200 px apparaît avec un marqueur
 * déplaçable — le déplacement déclenche un reverse geocoding Nominatim automatique.
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
 *   Le composant utilisera alors window.google.maps.places.AutocompleteService
 *   avec le filtre components: 'country:ci'.
 *
 * ─── Props ───────────────────────────────────────────────────────────────────
 *   value           — valeur contrôlée du champ texte
 *   onChange        — appelé à chaque frappe (string)
 *   onSelect        — appelé quand une suggestion est choisie (adresse, commune)
 *   placeholder     — texte placeholder (optionnel)
 *   communes        — liste des communes pour la détection automatique
 *   selectedCommune — commune actuellement sélectionnée dans le dropdown parent ;
 *                     la requête Nominatim sera scopée sur cette commune via
 *                     le paramètre viewbox + bounded=1 (si bbox connue) ET en
 *                     ajoutant le nom de la commune dans la query.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Suggestion {
  label: string       // Ligne principale (lieu ou rue)
  sublabel: string    // Ligne secondaire (ville, pays)
  adresse: string     // Valeur complète à injecter dans le champ
  commune: string     // Commune détectée (ou vide)
  lat: number
  lng: number
}

export interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (adresse: string, commune: string) => void
  placeholder?: string
  communes?: string[]
  /** Commune sélectionnée dans le dropdown parent — scope la recherche Nominatim */
  selectedCommune?: string
}

// ─── Constantes carte ─────────────────────────────────────────────────────────

const ABIDJAN_CENTER: [number, number] = [5.3484, -4.0083]

/** Icône SVG custom (évite les problèmes de chemins d'assets Vite avec les icônes Leaflet par défaut) */
function createPinIcon(dragged = false) {
  const color = dragged ? '#F4A726' : '#064D40'
  return L.divIcon({
    className: '',
    html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))">
      <svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C8.477 0 4 4.477 4 10c0 7.5 10 20 10 20s10-12.5 10-20C24 4.477 19.523 0 14 0z"
              fill="${color}"/>
        <circle cx="14" cy="10" r="4" fill="white"/>
      </svg>
    </div>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  })
}

// ─── Nominatim ────────────────────────────────────────────────────────────────

/**
 * Bounding boxes par commune d'Abidjan (format Nominatim : minLon,maxLat,maxLon,minLat).
 * Utilisées avec viewbox + bounded=1 pour restreindre les résultats à la zone exacte.
 */
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
  const candidates = [addr.city_district, addr.suburb, addr.neighbourhood, addr.quarter]
  for (const candidate of candidates) {
    if (!candidate) continue
    const lower = candidate.toLowerCase()
    const match = communes.find(
      c => lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower)
    )
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
  const q = selectedCommune
    ? `${query}, ${selectedCommune}, Abidjan, Côte d'Ivoire`
    : `${query}, Abidjan, Côte d'Ivoire`
  url.searchParams.set('q', q)
  url.searchParams.set('countrycodes', 'ci')
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '6')
  url.searchParams.set('accept-language', 'fr')
  url.searchParams.set('addressdetails', '1')

  const bbox = selectedCommune ? COMMUNE_BBOX[selectedCommune] : undefined
  if (bbox) {
    url.searchParams.set('viewbox', bbox)
    url.searchParams.set('bounded', '1')
  }

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  const data: NominatimResult[] = await res.json()

  return data.map(item => {
    const parts   = item.display_name.split(',')
    const label   = parts[0].trim()
    const sublabel = parts.slice(1, 4).join(',').trim()
    const commune  = detectCommune(item.address, communes)
    const adresse  = parts
      .filter(p => !p.trim().match(/^(Côte d'Ivoire|Ivory Coast|CI)$/i))
      .slice(0, 4).join(',').trim()

    return { label, sublabel, adresse, commune, lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
  })
}

async function reverseGeocode(
  lat: number,
  lng: number,
  communes: string[],
): Promise<{ adresse: string; commune: string }> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr&addressdetails=1`,
    { headers: { Accept: 'application/json' } },
  )
  const data = await res.json()
  const addr = data.address ?? {}
  const commune = detectCommune(addr, communes)
  const parts = [addr.house_number, addr.road, addr.neighbourhood].filter(Boolean)
  const adresse = parts.length > 0
    ? parts.join(', ')
    : (data.display_name ?? '').split(',').slice(0, 3).join(',').trim()
  return { adresse, commune }
}

// ─── Google Places (stub — activé via VITE_GEOCODING_PROVIDER=google) ─────────

async function searchGoogle(query: string, communes: string[], selectedCommune?: string): Promise<Suggestion[]> {
  const g = (window as unknown as { google?: { maps?: { places?: { AutocompleteService?: unknown } } } }).google
  if (!g?.maps?.places?.AutocompleteService) {
    console.warn('[AddressAutocomplete] Google Places SDK non chargé.')
    return []
  }
  const service = new (g.maps.places as { AutocompleteService: new () => {
    getPlacePredictions: (
      req: { input: string; componentRestrictions: { country: string }; language: string },
      cb: (results: Array<{ description: string; structured_formatting: { main_text: string; secondary_text: string } }> | null, status: string) => void
    ) => void
  } }).AutocompleteService()

  return new Promise(resolve => {
    const input = selectedCommune ? `${query} ${selectedCommune}` : query
    service.getPlacePredictions(
      { input, componentRestrictions: { country: 'ci' }, language: 'fr' },
      (results, status) => {
        if (status !== 'OK' || !results) { resolve([]); return }
        resolve(results.map(r => {
          const commune = communes.find(c => r.description.toLowerCase().includes(c.toLowerCase())) ?? ''
          return {
            label:    r.structured_formatting.main_text,
            sublabel: r.structured_formatting.secondary_text,
            adresse:  r.description,
            commune,
            lat: ABIDJAN_CENTER[0],
            lng: ABIDJAN_CENTER[1],
          }
        }))
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

  const debounceRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef     = useRef<HTMLDivElement>(null)
  const inputRef         = useRef<HTMLInputElement>(null)
  const mapContainerRef  = useRef<HTMLDivElement>(null)
  const leafletMapRef    = useRef<L.Map | null>(null)
  const markerRef        = useRef<L.Marker | null>(null)
  // Stable ref so marker dragend always gets fresh callbacks
  const onSelectRef      = useRef(onSelect)
  const onChangeRef      = useRef(onChange)
  const communesRef      = useRef(communes)
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { communesRef.current = communes }, [communes])

  // ── Initialize Leaflet map when showMap becomes true ────────────────────────
  useEffect(() => {
    if (!showMap || !mapContainerRef.current || leafletMapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: mapPos,
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Compact zoom control bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Compact attribution
    L.control.attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('© <a href="https://osm.org/copyright" target="_blank">OSM</a>')
      .addTo(map)

    const marker = L.marker(mapPos, { draggable: true, icon: createPinIcon() }).addTo(map)

    marker.on('dragstart', () => marker.setIcon(createPinIcon(true)))
    marker.on('dragend', async () => {
      marker.setIcon(createPinIcon(false))
      const { lat, lng } = marker.getLatLng()
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
    markerRef.current = marker

    // Force correct size (container may have been zero-size at mount)
    setTimeout(() => map.invalidateSize(), 50)

    return () => {
      map.remove()
      leafletMapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap])

  // ── Pan + move marker when mapPos changes ───────────────────────────────────
  useEffect(() => {
    if (!leafletMapRef.current || !markerRef.current) return
    leafletMapRef.current.setView(mapPos, 16, { animate: true })
    markerRef.current.setLatLng(mapPos)
  }, [mapPos])

  // ── Close dropdown on click outside ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Re-search when selectedCommune changes ──────────────────────────────────
  useEffect(() => {
    if (value.trim().length >= 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => search(value), 300)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCommune])

  // ── Debounced search ────────────────────────────────────────────────────────
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
      setSuggestions([])
      setOpen(false)
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
    // Show / update map
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
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* ── Input ── */}
      <div className="relative">
        <MapPin
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#064D40] shrink-0"
        />
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
          {loading ? (
            <Loader2 size={14} className="text-[#5C7A74] animate-spin" />
          ) : value ? (
            <button onClick={handleClear} className="text-[#5C7A74] hover:text-[#1A2B26]">
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Dropdown suggestions ── */}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#D4E5E1] rounded-2xl shadow-xl overflow-hidden z-50">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleSelect(s)}
              className={`
                w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-[#D4E5E1] last:border-0
                ${i === activeIndex ? 'bg-[#064D40]/5' : 'hover:bg-[#F5F7F6]'}
              `}
            >
              <div className="w-7 h-7 rounded-full bg-[#064D40]/10 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={13} className="text-[#064D40]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A2B26] truncate">{s.label}</p>
                {s.sublabel && (
                  <p className="text-xs text-[#5C7A74] truncate mt-0.5">{s.sublabel}</p>
                )}
                {s.commune && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-[#064D40] bg-[#064D40]/10 px-1.5 py-0.5 rounded">
                    {s.commune}
                  </span>
                )}
              </div>
            </button>
          ))}
          <div className="px-4 py-2 flex items-center justify-between bg-[#F5F7F6]">
            {selectedCommune ? (
              <span className="text-[10px] font-semibold text-[#064D40]">
                📍 Scopé sur {selectedCommune}
              </span>
            ) : <span />}
            <span className="text-[10px] font-bold text-[#5C7A74]">
              {PROVIDER === 'google' ? 'Google Maps' : 'OpenStreetMap'}
            </span>
          </div>
        </div>
      )}

      {/* ── Leaflet map (shown after suggestion selected) ── */}
      {showMap && (
        <div className="mt-2 rounded-2xl overflow-hidden border border-[#D4E5E1] shadow-sm relative">
          <div ref={mapContainerRef} style={{ height: '200px' }} />
          {reversing && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl z-[1000]">
              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-[#D4E5E1]">
                <Loader2 size={14} className="text-[#064D40] animate-spin" />
                <span className="text-xs font-semibold text-[#064D40]">Mise à jour de l'adresse…</span>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 rounded-lg px-2 py-1 text-[10px] text-[#5C7A74] font-medium shadow-sm">
            Déplacez le marqueur pour ajuster
          </div>
        </div>
      )}
    </div>
  )
}
