/**
 * AddressAutocomplete.tsx
 *
 * Composant d'autocomplétion d'adresse style Uber/Yango.
 * Suggestions à partir de 3 caractères, debounce 300 ms.
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
 *   value       — valeur contrôlée du champ texte
 *   onChange    — appelé à chaque frappe (string)
 *   onSelect    — appelé quand une suggestion est choisie (adresse, commune)
 *   placeholder — texte placeholder (optionnel)
 *   communes    — liste des communes pour la détection automatique
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Suggestion {
  label: string       // Ligne principale (lieu ou rue)
  sublabel: string    // Ligne secondaire (ville, pays)
  adresse: string     // Valeur complète à injecter dans le champ
  commune: string     // Commune détectée (ou vide)
}

export interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (adresse: string, commune: string) => void
  placeholder?: string
  communes?: string[]
}

// ─── Nominatim ────────────────────────────────────────────────────────────────

interface NominatimResult {
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

async function searchNominatim(query: string, communes: string[]): Promise<Suggestion[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', `${query}, Abidjan, Côte d'Ivoire`)
  url.searchParams.set('countrycodes', 'ci')
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '6')
  url.searchParams.set('accept-language', 'fr')
  url.searchParams.set('addressdetails', '1')

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
  const data: NominatimResult[] = await res.json()

  return data.map(item => {
    // Split display_name: first part = lieu, rest = contexte
    const parts = item.display_name.split(',')
    const label    = parts[0].trim()
    const sublabel = parts.slice(1, 4).join(',').trim()
    const commune  = detectCommune(item.address, communes)

    // Adresse courte : on retire "Côte d'Ivoire" pour gagner de la place
    const adresse = parts
      .filter(p => !p.trim().match(/^(Côte d'Ivoire|Ivory Coast|CI)$/i))
      .slice(0, 4)
      .join(',')
      .trim()

    return { label, sublabel, adresse, commune }
  })
}

// ─── Google Places (stub — activé via VITE_GEOCODING_PROVIDER=google) ─────────

async function searchGoogle(query: string, communes: string[]): Promise<Suggestion[]> {
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
    service.getPlacePredictions(
      { input: query, componentRestrictions: { country: 'ci' }, language: 'fr' },
      (results, status) => {
        if (status !== 'OK' || !results) { resolve([]); return }
        const suggestions: Suggestion[] = results.map(r => {
          const commune = communes.find(c =>
            r.description.toLowerCase().includes(c.toLowerCase())
          ) ?? ''
          return {
            label:    r.structured_formatting.main_text,
            sublabel: r.structured_formatting.secondary_text,
            adresse:  r.description,
            commune,
          }
        })
        resolve(suggestions)
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
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading]         = useState(false)
  const [open, setOpen]               = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search
  const search = useCallback(async (query: string) => {
    if (query.trim().length < 3) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    try {
      const results = PROVIDER === 'google'
        ? await searchGoogle(query, communes)
        : await searchNominatim(query, communes)
      setSuggestions(results)
      setOpen(results.length > 0)
      setActiveIndex(-1)
    } catch {
      setSuggestions([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [communes])

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
  }

  const handleClear = () => {
    onChange('')
    setSuggestions([])
    setOpen(false)
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
      {/* Input */}
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
        {/* Trailing icon: spinner or clear */}
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

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#D4E5E1] rounded-2xl shadow-xl overflow-hidden z-50">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={e => e.preventDefault()} // prevent blur before click
              onClick={() => handleSelect(s)}
              className={`
                w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-[#D4E5E1] last:border-0
                ${i === activeIndex ? 'bg-[#064D40]/5' : 'hover:bg-[#F5F7F6]'}
              `}
            >
              {/* Pin dot */}
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
          <div className="px-4 py-2 flex items-center justify-end gap-1 bg-[#F5F7F6]">
            <span className="text-[10px] text-[#5C7A74]">Résultats</span>
            <span className="text-[10px] font-bold text-[#5C7A74]">
              {PROVIDER === 'google' ? 'Google Maps' : 'OpenStreetMap'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
