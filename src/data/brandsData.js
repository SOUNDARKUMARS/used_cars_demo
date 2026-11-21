// Brand Logos imported directly from src/assets/brand-logos/
// Curated strictly for vehicles usually available in the Indian automotive market
import marutiLogo from '../assets/brand-logos/maruti-logo.svg'
import hyundaiLogo from '../assets/brand-logos/hyundai-logo.svg'
import tataLogo from '../assets/brand-logos/tata-logo.png'
import mahindraLogo from '../assets/brand-logos/mahindra-logo.png'
import toyotaLogo from '../assets/brand-logos/toyota-logo.svg'
import hondaLogo from '../assets/brand-logos/honda-logo.png'
import kiaLogo from '../assets/brand-logos/kia-logo.svg'
import volkswagenLogo from '../assets/brand-logos/volkswagen-logo.svg'
import skodaLogo from '../assets/brand-logos/skoda-logo.svg'
import mgLogo from '../assets/brand-logos/mg-logo.png'
import renaultLogo from '../assets/brand-logos/renault-logo.svg'
import nissanLogo from '../assets/brand-logos/nissan-logo.svg'
import fordLogo from '../assets/brand-logos/ford-logo.png'
import jeepLogo from '../assets/brand-logos/jeep-logo.svg'
import bmwLogo from '../assets/brand-logos/bmw-logo.svg'
import mercedesLogo from '../assets/brand-logos/mercedes-benz-logo.svg'
import audiLogo from '../assets/brand-logos/audi-logo.svg'
import volvoLogo from '../assets/brand-logos/volvo-logo.svg'
import landRoverLogo from '../assets/brand-logos/land-rover-logo.svg'
import jaguarLogo from '../assets/brand-logos/jaguar-logo.svg'
import porscheLogo from '../assets/brand-logos/porsche-logo.svg'
import miniLogo from '../assets/brand-logos/mini-logo.svg'
import citroenLogo from '../assets/brand-logos/citroen-logo.svg'
import bydLogo from '../assets/brand-logos/byd-logo.svg'
import lexusLogo from '../assets/brand-logos/lexus-logo.png'
import isuzuLogo from '../assets/brand-logos/isuzu-logo.svg'
import chevroletLogo from '../assets/brand-logos/chevrolet-logo.png'
import fiatLogo from '../assets/brand-logos/fiat-logo.svg'
import datsunLogo from '../assets/brand-logos/datsun-logo.png'
import mitsubishiLogo from '../assets/brand-logos/mitsubishi-logo.svg'

/**
 * Car brands usually available in India (mass-market, premium, pre-owned staples).
 * Excludes non-Indian market makes like Lotus, Aixam, Bugatti, Aro, etc.
 */
export const INDIAN_MARKET_BRANDS = [
  {
    id: 'maruti-suzuki',
    name: 'Maruti Suzuki',
    shortName: 'Maruti',
    logo: marutiLogo,
    popularModels: ['Swift', 'Baleno', 'Dzire', 'Brezza', 'Ertiga', 'Grand Vitara', 'Fronx', 'WagonR', 'Alto'],
  },
  {
    id: 'hyundai',
    name: 'Hyundai',
    shortName: 'Hyundai',
    logo: hyundaiLogo,
    popularModels: ['Creta', 'Venue', 'i20', 'Grand i10 Nios', 'Verna', 'Exter', 'Tucson', 'Alcazar'],
  },
  {
    id: 'tata',
    name: 'Tata',
    shortName: 'Tata Motors',
    logo: tataLogo,
    popularModels: ['Nexon', 'Punch', 'Harrier', 'Safari', 'Tiago', 'Altroz', 'Tigor', 'Curvv'],
  },
  {
    id: 'mahindra',
    name: 'Mahindra',
    shortName: 'Mahindra',
    logo: mahindraLogo,
    popularModels: ['Thar', 'Scorpio-N', 'XUV700', 'Scorpio Classic', 'Bolero', 'XUV 3XO', 'XUV300'],
  },
  {
    id: 'toyota',
    name: 'Toyota',
    shortName: 'Toyota',
    logo: toyotaLogo,
    popularModels: ['Innova Crysta', 'Fortuner', 'Innova Hycross', 'Urban Cruiser Hyryder', 'Glanza', 'Camry'],
  },
  {
    id: 'honda',
    name: 'Honda',
    shortName: 'Honda',
    logo: hondaLogo,
    popularModels: ['City', 'Amaze', 'Elevate', 'WR-V', 'Jazz', 'Civic'],
  },
  {
    id: 'kia',
    name: 'Kia',
    shortName: 'Kia',
    logo: kiaLogo,
    popularModels: ['Seltos', 'Sonet', 'Carens', 'Carnival', 'EV6'],
  },
  {
    id: 'volkswagen',
    name: 'Volkswagen',
    shortName: 'VW',
    logo: volkswagenLogo,
    popularModels: ['Virtus', 'Taigun', 'Polo', 'Vento', 'Tiguan'],
  },
  {
    id: 'skoda',
    name: 'Skoda',
    shortName: 'Skoda',
    logo: skodaLogo,
    popularModels: ['Slavia', 'Kushaq', 'Octavia', 'Superb', 'Kodiaq', 'Rapid'],
  },
  {
    id: 'mg',
    name: 'MG',
    shortName: 'MG Motor',
    logo: mgLogo,
    popularModels: ['Hector', 'Astor', 'ZS EV', 'Comet EV', 'Gloster', 'Windsor EV'],
  },
  {
    id: 'renault',
    name: 'Renault',
    shortName: 'Renault',
    logo: renaultLogo,
    popularModels: ['Kwid', 'Triber', 'Kiger', 'Duster'],
  },
  {
    id: 'nissan',
    name: 'Nissan',
    shortName: 'Nissan',
    logo: nissanLogo,
    popularModels: ['Magnite', 'Kicks', 'Micra', 'Sunny', 'X-Trail'],
  },
  {
    id: 'ford',
    name: 'Ford',
    shortName: 'Ford',
    logo: fordLogo,
    popularModels: ['EcoSport', 'Endeavour', 'Figo', 'Aspire', 'Freestyle'],
  },
  {
    id: 'jeep',
    name: 'Jeep',
    shortName: 'Jeep',
    logo: jeepLogo,
    popularModels: ['Compass', 'Meridian', 'Wrangler', 'Grand Cherokee'],
  },
  {
    id: 'bmw',
    name: 'BMW',
    shortName: 'BMW',
    logo: bmwLogo,
    popularModels: ['3 Series', '5 Series', 'X1', 'X3', 'X5', '2 Series Gran Coupe'],
  },
  {
    id: 'mercedes-benz',
    name: 'Mercedes-Benz',
    shortName: 'Mercedes',
    logo: mercedesLogo,
    popularModels: ['C-Class', 'E-Class', 'GLA', 'GLC', 'GLE', 'A-Class Limousine'],
  },
  {
    id: 'audi',
    name: 'Audi',
    shortName: 'Audi',
    logo: audiLogo,
    popularModels: ['A4', 'A6', 'Q3', 'Q5', 'Q7'],
  },
  {
    id: 'volvo',
    name: 'Volvo',
    shortName: 'Volvo',
    logo: volvoLogo,
    popularModels: ['XC40', 'XC60', 'XC90', 'S90', 'C40 Recharge'],
  },
  {
    id: 'land-rover',
    name: 'Land Rover',
    shortName: 'Range Rover',
    logo: landRoverLogo,
    popularModels: ['Defender', 'Range Rover Evoque', 'Range Rover Velar', 'Discovery Sport'],
  },
  {
    id: 'jaguar',
    name: 'Jaguar',
    shortName: 'Jaguar',
    logo: jaguarLogo,
    popularModels: ['XE', 'XF', 'F-Pace'],
  },
  {
    id: 'porsche',
    name: 'Porsche',
    shortName: 'Porsche',
    logo: porscheLogo,
    popularModels: ['Macan', 'Cayenne', 'Panamera', '911', 'Taycan'],
  },
  {
    id: 'mini',
    name: 'Mini',
    shortName: 'Mini Cooper',
    logo: miniLogo,
    popularModels: ['Cooper', 'Countryman'],
  },
  {
    id: 'citroen',
    name: 'Citroen',
    shortName: 'Citroen',
    logo: citroenLogo,
    popularModels: ['C3', 'C3 Aircross', 'Basalt', 'C5 Aircross'],
  },
  {
    id: 'byd',
    name: 'BYD',
    shortName: 'BYD',
    logo: bydLogo,
    popularModels: ['Atto 3', 'Seal', 'eMax 7'],
  },
  {
    id: 'lexus',
    name: 'Lexus',
    shortName: 'Lexus',
    logo: lexusLogo,
    popularModels: ['ES', 'NX', 'RX', 'LX'],
  },
  {
    id: 'isuzu',
    name: 'Isuzu',
    shortName: 'Isuzu',
    logo: isuzuLogo,
    popularModels: ['D-Max V-Cross', 'MU-X', 'Hi-Lander'],
  },
  {
    id: 'chevrolet',
    name: 'Chevrolet',
    shortName: 'Chevy',
    logo: chevroletLogo,
    popularModels: ['Beat', 'Cruze', 'Sail', 'Spark', 'Tavera'],
  },
  {
    id: 'fiat',
    name: 'Fiat',
    shortName: 'Fiat',
    logo: fiatLogo,
    popularModels: ['Punto', 'Linea', 'Avventura', 'Abarth Punto'],
  },
  {
    id: 'datsun',
    name: 'Datsun',
    shortName: 'Datsun',
    logo: datsunLogo,
    popularModels: ['Go', 'Go+', 'redi-GO'],
  },
  {
    id: 'mitsubishi',
    name: 'Mitsubishi',
    shortName: 'Mitsubishi',
    logo: mitsubishiLogo,
    popularModels: ['Pajero Sport', 'Lancer', 'Outlander'],
  },
]

// Backwards compatibility aliases
export const ALL_BRANDS = INDIAN_MARKET_BRANDS
export const INDIAN_BRANDS = INDIAN_MARKET_BRANDS.filter((b) =>
  ['maruti-suzuki', 'tata', 'mahindra'].includes(b.id)
)
export const GLOBAL_BRANDS = INDIAN_MARKET_BRANDS.filter(
  (b) => !['maruti-suzuki', 'tata', 'mahindra'].includes(b.id)
)

/**
 * Look up brand details by name or alias
 */
export function getBrandByName(name) {
  if (!name) return null
  const clean = name.trim().toLowerCase()
  return (
    INDIAN_MARKET_BRANDS.find(
      (b) =>
        b.name.toLowerCase() === clean ||
        (b.shortName && b.shortName.toLowerCase() === clean) ||
        b.id.toLowerCase() === clean
    ) || null
  )
}
