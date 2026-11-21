import React from 'react'
import {
  Fuel,
  Gauge,
  TrendingDown,
  Flame,
  Zap,
  Navigation,
  Leaf,
  Activity,
  TrendingUp,
  Cpu,
  Sliders,
  CircleDot,
  ChevronsRight,
  ShieldCheck,
  VolumeX,
  Volume1,
  Maximize2,
  Armchair,
  Sparkles,
  Fan,
  Thermometer,
  Wind,
  SlidersHorizontal,
  Key,
  Power,
  Lightbulb,
  Sun,
  Disc,
  Shield,
  Camera,
  Video,
  Radio,
  Lock,
  Tv,
  Smartphone,
  Wifi,
  Volume2,
  BatteryCharging,
  Mic,
  Award,
  Eye,
  CloudRain,
  Maximize,
  Package,
  Box,
  ArrowUp,
  Layers,
  Users,
  Heart,
  Compass,
  UserCheck,
  User,
  CheckCircle2,
  CheckCircle,
  FileText,
  Droplets,
  Wrench,
  FileCheck,
  Smile,
  Check,
  Plus,
} from 'lucide-react'

// Icon mapping dictionary
export const ICON_COMPONENTS = {
  Fuel,
  Gauge,
  TrendingDown,
  Flame,
  Zap,
  Navigation,
  Leaf,
  Activity,
  TrendingUp,
  Cpu,
  Sliders,
  CircleDot,
  ChevronsRight,
  ShieldCheck,
  VolumeX,
  Volume1,
  Maximize2,
  Armchair,
  Sparkles,
  Fan,
  Thermometer,
  Wind,
  SlidersHorizontal,
  Key,
  Power,
  Lightbulb,
  Sun,
  Disc,
  Shield,
  Camera,
  Video,
  Radio,
  Lock,
  Tv,
  Smartphone,
  Wifi,
  Volume2,
  BatteryCharging,
  Mic,
  Award,
  Eye,
  CloudRain,
  Maximize,
  Package,
  Box,
  ArrowUp,
  Layers,
  Users,
  Heart,
  Compass,
  UserCheck,
  User,
  CheckCircle2,
  CheckCircle,
  FileText,
  Droplets,
  Wrench,
  FileCheck,
  Smile,
  Check,
  Plus,
}

// Render icon helper (Using React.createElement for standard JS compatibility)
export function renderFeatureIcon(iconName, className = 'w-5 h-5') {
  const IconComponent = ICON_COMPONENTS[iconName] || Sparkles
  return React.createElement(IconComponent, { className })
}

/**
 * Curated Automotive Feature Bank (Genuine equipment, luxury, technology & styling features)
 * Categorized into 7 essential equipment domains:
 * 1. Fuel & Efficiency (4)
 * 2. Performance & Engine (8)
 * 3. Comfort & Convenience (9)
 * 4. Safety & Security (10)
 * 5. Technology & Infotainment (8)
 * 6. Exterior & Design (9)
 * 7. Space & Practicality (5)
 *
 * NOTE: Baseline standards like 100% Non-Accidental, Non-Flooded, Original Paint,
 * 200-Point Inspected, Warranty, Clear RTO, and Ownership are mandatory Nova dealership
 * promises, not vehicle equipment options.
 */
export const FEATURES_BANK = [
  // ==========================================
  // 1. FUEL & EFFICIENCY (4 distinct features)
  // ==========================================
  {
    id: 'fuel-efficient',
    name: 'Fuel Efficient / High Mileage',
    category: 'Fuel & Efficiency',
    iconName: 'Fuel',
    description: 'Proven high km/l fuel economy with frugal daily running costs',
    popular: true,
  },
  {
    id: 'cng-compatible',
    name: 'CNG Kit Equipped',
    category: 'Fuel & Efficiency',
    iconName: 'Flame',
    description: 'Factory or approved dual-fuel CNG kit offering maximum savings',
    popular: false,
  },
  {
    id: 'eco-mode',
    name: 'Eco Drive Mode',
    category: 'Fuel & Efficiency',
    iconName: 'Leaf',
    description: 'Smart powertrain tuning optimizing fuel conservation',
    popular: false,
  },
  {
    id: 'long-range',
    name: 'Long Touring Range',
    category: 'Fuel & Efficiency',
    iconName: 'Navigation',
    description: 'High fuel tank capacity ideal for uninterrupted highway journeys',
    popular: false,
  },

  // ==========================================
  // 2. PERFORMANCE & ENGINE (6 distinct features)
  // ==========================================
  {
    id: 'powerful-engine',
    name: 'Powerful Engine & Pickup',
    category: 'Performance & Engine',
    iconName: 'Zap',
    description: 'Strong acceleration and responsive throttle for confident overtaking',
    popular: true,
  },
  {
    id: 'turbocharged-engine',
    name: 'Turbocharged Engine',
    category: 'Performance & Engine',
    iconName: 'Wind',
    description: 'Punchy turbo boost delivering immediate mid-range torque',
    popular: true,
  },
  {
    id: 'smooth-transmission',
    name: 'Smooth Transmission',
    category: 'Performance & Engine',
    iconName: 'Sliders',
    description: 'Seamless gear shifts with light clutch and refined shift action',
    popular: true,
  },
  {
    id: 'refined-engine',
    name: 'Refined & Quiet Engine',
    category: 'Performance & Engine',
    iconName: 'Activity',
    description: 'Low NVH acoustic insulation with silky-smooth, vibration-free idle',
    popular: false,
  },
  {
    id: 'drive-modes',
    name: 'Drive Modes (Eco / Sport)',
    category: 'Performance & Engine',
    iconName: 'Gauge',
    description: 'Switchable dynamics tuning throttle response and steering weight',
    popular: false,
  },
  {
    id: 'responsive-steering',
    name: 'Responsive Steering',
    category: 'Performance & Engine',
    iconName: 'CircleDot',
    description: 'Direct steering feel with confident high-speed lane discipline',
    popular: false,
  },
  {
    id: 'paddle-shifters',
    name: 'Paddle Shifters (F1 Style)',
    category: 'Performance & Engine',
    iconName: 'Sliders',
    description: 'Steering-mounted fingertip paddle shifters for engaging manual control',
    popular: true,
  },
  {
    id: 'all-wheel-drive',
    name: '4x4 / All-Wheel Drive (AWD)',
    category: 'Performance & Engine',
    iconName: 'Zap',
    description: 'All-terrain electronic 4WD / AWD drivetrain with terrain response modes',
    popular: true,
  },

  // ==========================================
  // 3. COMFORT & CONVENIENCE (8 distinct features)
  // ==========================================
  {
    id: 'automatic-climate-control',
    name: 'Automatic Climate Control',
    category: 'Comfort & Convenience',
    iconName: 'Fan',
    description: 'Smart thermostat cooling maintaining desired cabin temperature',
    popular: true,
  },
  {
    id: 'rear-ac-vents',
    name: 'Rear AC Vents',
    category: 'Comfort & Convenience',
    iconName: 'Wind',
    description: 'Dedicated rear cooling vents for fast second-row passenger comfort',
    popular: true,
  },
  {
    id: 'push-button-start',
    name: 'Push Button Start & Smart Key',
    category: 'Comfort & Convenience',
    iconName: 'Power',
    description: 'Keyless entry with one-touch engine start/stop button',
    popular: true,
  },
  {
    id: 'cruise-control',
    name: 'Cruise Control',
    category: 'Comfort & Convenience',
    iconName: 'Gauge',
    description: 'Effortless highway cruising with steering-mounted speed controls',
    popular: true,
  },
  {
    id: 'ventilated-seats',
    name: 'Ventilated Front Seats',
    category: 'Comfort & Convenience',
    iconName: 'Thermometer',
    description: 'Cooled front seats providing relief in hot and humid weather',
    popular: true,
  },
  {
    id: 'power-seats',
    name: 'Power Adjustable Seats',
    category: 'Comfort & Convenience',
    iconName: 'Armchair',
    description: 'Multi-directional electric seat adjustment with ergonomic lumbar support',
    popular: false,
  },
  {
    id: 'center-armrest',
    name: 'Front & Rear Armrests',
    category: 'Comfort & Convenience',
    iconName: 'Armchair',
    description: 'Plush center armrests with integrated cup holders and storage box',
    popular: false,
  },
  {
    id: 'ambient-lighting',
    name: 'Ambient Cabin Lighting',
    category: 'Comfort & Convenience',
    iconName: 'Sun',
    description: 'Multi-color mood lighting across dashboard and door contours',
    popular: false,
  },
  {
    id: 'leather-seats',
    name: 'Premium Leatherette Upholstery',
    category: 'Comfort & Convenience',
    iconName: 'Layers',
    description: 'Supple leatherette seats with contrast stitching and stain-resistant coating',
    popular: true,
  },

  // ==========================================
  // 4. SAFETY & SECURITY (9 distinct features)
  // ==========================================
  {
    id: 'airbags',
    name: 'Airbags (Dual / Multi)',
    category: 'Safety & Security',
    iconName: 'Shield',
    description: 'Front, side, and curtain airbags providing all-round crash safety',
    popular: true,
  },
  {
    id: 'abs',
    name: 'ABS with EBD',
    category: 'Safety & Security',
    iconName: 'Disc',
    description: 'Anti-lock braking system with electronic brake force distribution',
    popular: true,
  },
  {
    id: 'esp-stability-control',
    name: 'ESP & Traction Control',
    category: 'Safety & Security',
    iconName: 'Activity',
    description: 'Electronic stability control counteracting vehicle skids and wheel-slip',
    popular: true,
  },
  {
    id: 'rear-parking-camera',
    name: 'Reverse Parking Camera',
    category: 'Safety & Security',
    iconName: 'Camera',
    description: 'High-definition reverse camera with dynamic steering guidelines',
    popular: true,
  },
  {
    id: '360-camera',
    name: '360° Surround View Camera',
    category: 'Safety & Security',
    iconName: 'Video',
    description: '360-degree bird-eye camera for effortless tight-spot parking',
    popular: true,
  },
  {
    id: 'parking-sensors',
    name: 'Front & Rear Parking Sensors',
    category: 'Safety & Security',
    iconName: 'Radio',
    description: 'Ultrasonic proximity acoustic obstacle alert sensors',
    popular: true,
  },
  {
    id: 'hill-hold-assist',
    name: 'Hill Start & Hold Assist',
    category: 'Safety & Security',
    iconName: 'TrendingUp',
    description: 'Prevents vehicle rollback when taking off on steep uphill slopes',
    popular: false,
  },
  {
    id: 'isofix-child-seat-mounts',
    name: 'ISOFIX Child Seat Mounts',
    category: 'Safety & Security',
    iconName: 'Lock',
    description: 'Standardized rigid anchor points for child safety car seats',
    popular: false,
  },
  {
    id: 'tyre-pressure-monitoring',
    name: 'Tyre Pressure Monitor (TPMS)',
    category: 'Safety & Security',
    iconName: 'CircleDot',
    description: 'Real-time telemetry monitoring individual tyre pressure & puncture alert',
    popular: false,
  },
  {
    id: 'adas-safety-suite',
    name: 'Level 2 ADAS Safety Suite',
    category: 'Safety & Security',
    iconName: 'ShieldCheck',
    description: 'Autonomous emergency braking, lane keep assist, and adaptive cruise control',
    popular: true,
  },

  // ==========================================
  // 5. TECHNOLOGY & INFOTAINMENT (7 distinct features)
  // ==========================================
  {
    id: 'touchscreen-display',
    name: 'Touchscreen Infotainment',
    category: 'Technology & Infotainment',
    iconName: 'Tv',
    description: 'Crisp capacitive HD touchscreen with intuitive interface',
    popular: true,
  },
  {
    id: 'apple-carplay',
    name: 'Apple CarPlay & Android Auto',
    category: 'Technology & Infotainment',
    iconName: 'Smartphone',
    description: 'Seamless wireless or wired smartphone mirroring for Maps and music',
    popular: true,
  },
  {
    id: 'steering-mounted-controls',
    name: 'Steering-Mounted Controls',
    category: 'Technology & Infotainment',
    iconName: 'Sliders',
    description: 'Fingertip audio, calls, cruise, and voice recognition controls on steering',
    popular: true,
  },
  {
    id: 'digital-instrument-cluster',
    name: 'Digital Instrument Cluster',
    category: 'Technology & Infotainment',
    iconName: 'Gauge',
    description: 'Modern full-color driver information cockpit display',
    popular: true,
  },
  {
    id: 'wireless-charging',
    name: 'Wireless Smartphone Charging',
    category: 'Technology & Infotainment',
    iconName: 'BatteryCharging',
    description: 'Qi-certified inductive wireless charging pad in center console',
    popular: true,
  },
  {
    id: 'premium-sound-system',
    name: 'Premium Surround Sound System',
    category: 'Technology & Infotainment',
    iconName: 'Volume2',
    description: 'Multi-speaker acoustic sound system with rich bass and crystal fidelity',
    popular: false,
  },
  {
    id: 'inbuilt-navigation',
    name: 'Inbuilt GPS Navigation',
    category: 'Technology & Infotainment',
    iconName: 'Navigation',
    description: 'Integrated satellite navigation with live turn-by-turn guidance',
    popular: false,
  },
  {
    id: 'connected-car-tech',
    name: 'Connected Car Tech (Mobile App)',
    category: 'Technology & Infotainment',
    iconName: 'Smartphone',
    description: 'Telematics app with remote AC start, live location tracking, and geo-fencing',
    popular: true,
  },

  // ==========================================
  // 6. EXTERIOR & DESIGN (8 distinct features)
  // ==========================================
  {
    id: 'sunroof',
    name: 'Electric Sunroof',
    category: 'Exterior & Design',
    iconName: 'Sun',
    description: 'One-touch powered electric sunroof with anti-pinch protection',
    popular: true,
  },
  {
    id: 'panoramic-sunroof',
    name: 'Panoramic Sky Sunroof',
    category: 'Exterior & Design',
    iconName: 'Sun',
    description: 'Expansive dual-pane panoramic glass sunroof for an open-air cabin',
    popular: true,
  },
  {
    id: 'alloy-wheels',
    name: 'Dual-Tone Alloy Wheels',
    category: 'Exterior & Design',
    iconName: 'Disc',
    description: 'Diamond-cut stylish alloy wheels enhancing stance and road presence',
    popular: true,
  },
  {
    id: 'led-headlamps',
    name: 'LED Headlamps & DRLs',
    category: 'Exterior & Design',
    iconName: 'Lightbulb',
    description: 'High-intensity LED headlamps paired with signature daytime running lights',
    popular: true,
  },
  {
    id: 'fog-lamps',
    name: 'Front & Rear Fog Lamps',
    category: 'Exterior & Design',
    iconName: 'CloudRain',
    description: 'Penetrating fog lamps for optimal visibility in mist and heavy rainfall',
    popular: false,
  },
  {
    id: 'electrically-adjustable-orvms',
    name: 'Power Folding Mirrors (ORVMs)',
    category: 'Exterior & Design',
    iconName: 'Maximize',
    description: 'Electrically adjustable and auto-folding mirrors with integrated turn signals',
    popular: true,
  },
  {
    id: 'roof-rails',
    name: 'Functional Roof Rails',
    category: 'Exterior & Design',
    iconName: 'ArrowUp',
    description: 'Sturdy roof rails for luggage carriers and sporty SUV profile',
    popular: false,
  },
  {
    id: 'rear-wiper-defogger',
    name: 'Rear Wiper & Defogger',
    category: 'Exterior & Design',
    iconName: 'Droplets',
    description: 'Heated rear windscreen defogger with intermittent wiper-washer',
    popular: false,
  },
  {
    id: 'shark-fin-antenna',
    name: 'Aerodynamic Shark Fin Antenna',
    category: 'Exterior & Design',
    iconName: 'Radio',
    description: 'Sleek aerodynamic roof-mounted antenna with clear FM/GPS reception',
    popular: false,
  },

  // ==========================================
  // 7. SPACE & PRACTICALITY (5 distinct features)
  // ==========================================
  {
    id: 'spacious-legroom',
    name: 'Spacious Cabin & Rear Legroom',
    category: 'Space & Practicality',
    iconName: 'Maximize2',
    description: 'Generous shoulder, knee, and head clearance ensuring executive comfort',
    popular: true,
  },
  {
    id: 'large-boot-space',
    name: 'Large Boot Space',
    category: 'Space & Practicality',
    iconName: 'Package',
    description: 'Expansive luggage cargo capacity accommodating full family luggage',
    popular: true,
  },
  {
    id: 'foldable-rear-seats',
    name: '60:40 Split Foldable Seats',
    category: 'Space & Practicality',
    iconName: 'Layers',
    description: 'Flexible split-folding rear seats for extended cargo utility',
    popular: true,
  },
  {
    id: '7-seater-capacity',
    name: '7-Seater / 3-Row Seating',
    category: 'Space & Practicality',
    iconName: 'Users',
    description: 'Three rows of comfortable seating designed for large families',
    popular: true,
  },
  {
    id: 'high-ground-clearance',
    name: 'High Ground Clearance',
    category: 'Space & Practicality',
    iconName: 'TrendingUp',
    description: 'Tall ground clearance effortlessly navigating Indian speed breakers and potholes',
    popular: true,
  },
]

// Backward compatibility alias map: maps legacy/condition IDs to genuine equipment
export const FEATURE_ALIASES = {
  // Fuel & Efficiency aliases
  'excellent-mileage': 'fuel-efficient',
  'low-fuel-consumption': 'fuel-efficient',
  'diesel-economy': 'fuel-efficient',
  'petrol-efficiency': 'fuel-efficient',
  'eco-friendly': 'eco-mode',
  'long-driving-range': 'long-range',

  // Performance aliases
  'excellent-pickup': 'powerful-engine',
  'high-torque': 'powerful-engine',
  'excellent-acceleration': 'powerful-engine',
  'smooth-gear-shifting': 'smooth-transmission',
  'smooth-engine': 'refined-engine',
  'low-engine-noise': 'refined-engine',
  'quiet-cabin': 'refined-engine',
  'light-steering': 'responsive-steering',
  'paddle-shift': 'paddle-shifters',
  '4x4': 'all-wheel-drive',
  'awd': 'all-wheel-drive',

  // Comfort aliases
  'spacious-interior': 'spacious-legroom',
  'large-cabin-space': 'spacious-legroom',
  'comfortable-seating': 'power-seats',
  'adjustable-seats': 'power-seats',
  'electrically-adjustable-seats': 'power-seats',
  'keyless-entry': 'push-button-start',
  'armrest': 'center-armrest',
  'premium-interiors': 'leather-seats',
  'leatherette-seats': 'leather-seats',

  // Safety aliases
  'ebd': 'abs',
  'traction-control': 'esp-stability-control',
  'strong-build-quality': 'airbags',
  'adas': 'adas-safety-suite',

  // Tech aliases
  'android-auto': 'apple-carplay',
  'bluetooth-connectivity': 'touchscreen-display',
  'navigation-system': 'inbuilt-navigation',
  'voice-commands': 'touchscreen-display',
  'connected-car': 'connected-car-tech',
  'telematics': 'connected-car-tech',

  // Exterior aliases
  'stylish-exterior': 'alloy-wheels',
  'premium-design': 'alloy-wheels',
  'drls': 'led-headlamps',
  'projector-headlamps': 'led-headlamps',
  'chrome-finish': 'alloy-wheels',
  'rear-spoiler': 'roof-rails',
  'shark-fin': 'shark-fin-antenna',

  // Space aliases
  'ample-headroom': 'spacious-legroom',
  'flexible-seating': 'foldable-rear-seats',
  'family-friendly': '7-seater-capacity',
  'easy-city-driving': 'responsive-steering',
  'smooth-city-driving': 'smooth-transmission',
  'easy-to-park': 'parking-sensors',

  // Legacy condition and baseline mappings (mapped to genuine equipment)
  'accident-free': 'airbags',
  'original-paint': 'alloy-wheels',
  'non-flooded-vehicle': 'esp-stability-control',
  'inspected-certified': 'esp-stability-control',
  'warranty-available': 'cruise-control',
  'clean-rto-documentation': 'touchscreen-display',
  'recently-serviced': 'smooth-transmission',
  'new-tyres': 'alloy-wheels',
  'single-owner': 'push-button-start',
  'valid-insurance': 'abs',
  'well-maintained': 'refined-engine',
  'low-maintenance-cost': 'fuel-efficient',
  'valid-fc': 'touchscreen-display',
  'excellent-exterior-condition': 'alloy-wheels',
  'scratch-free-body': 'alloy-wheels',
  'excellent-interior-condition': 'spacious-legroom',
  'clean-interiors': 'spacious-legroom',
  'no-mechanical-issues': 'refined-engine',
  'well-preserved': 'refined-engine',
  'ready-to-drive': 'smooth-transmission',
  'excellent-highway-comfort': 'cruise-control',
  'long-distance-comfort': 'cruise-control',
  'stable-at-high-speeds': 'esp-stability-control',
  'excellent-suspension': 'high-ground-clearance',
  'good-visibility': 'rear-parking-camera',
}

// 7 Distinct Automotive Equipment Categories (Excludes mandatory inspection/dealership promises)
export const FEATURE_CATEGORIES = [
  'All',
  'Fuel & Efficiency',
  'Performance & Engine',
  'Comfort & Convenience',
  'Safety & Security',
  'Technology & Infotainment',
  'Exterior & Design',
  'Space & Practicality',
]

// Category icons for UI tab pills
export const CATEGORY_ICONS = {
  All: '✨',
  'Fuel & Efficiency': '⛽',
  'Performance & Engine': '⚡',
  'Comfort & Convenience': '🛋️',
  'Safety & Security': '🛡️',
  'Technology & Infotainment': '📱',
  'Exterior & Design': '✨',
  'Space & Practicality': '📦',
}

// Preset default top features by body type
export const BODY_TYPE_DEFAULT_FEATURES = {
  Sedan: [
    'sunroof',
    'touchscreen-display',
    'cruise-control',
    'rear-parking-camera',
    'automatic-climate-control',
    'spacious-legroom',
    'airbags',
    'abs',
  ],
  SUV: [
    'sunroof',
    'touchscreen-display',
    'rear-parking-camera',
    'airbags',
    'cruise-control',
    'alloy-wheels',
    'high-ground-clearance',
    'hill-hold-assist',
  ],
  Hatchback: [
    'touchscreen-display',
    'rear-parking-camera',
    'steering-mounted-controls',
    'fuel-efficient',
    'abs',
    'airbags',
    'apple-carplay',
    'push-button-start',
  ],
  MPV: [
    'automatic-climate-control',
    '7-seater-capacity',
    'rear-parking-camera',
    'airbags',
    'spacious-legroom',
    'cruise-control',
    'push-button-start',
    'abs',
  ],
}

/**
 * Look up feature definition by ID or Name, with legacy alias resolution
 */
export function getFeatureById(id) {
  if (!id) return null
  const cleanId = String(id).trim().toLowerCase()
  const resolvedId = FEATURE_ALIASES[cleanId] || cleanId
  return (
    FEATURES_BANK.find(
      (f) =>
        f.id.toLowerCase() === resolvedId ||
        f.id.toLowerCase() === cleanId ||
        f.name.toLowerCase() === cleanId
    ) || null
  )
}

/**
 * Look up feature definition by Name
 */
export function getFeatureByName(name) {
  if (!name) return null
  const clean = String(name).trim().toLowerCase()
  return (
    FEATURES_BANK.find((f) => f.name.toLowerCase() === clean) ||
    getFeatureById(clean) ||
    null
  )
}

/**
 * Resolve an array of IDs or Objects to full feature items
 */
export function getFeaturesByIds(items = []) {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      if (!item) return null
      if (typeof item === 'object' && item.name) {
        const found = getFeatureById(item.id) || getFeatureByName(item.name)
        return found ? { ...found, ...item } : item
      }
      return getFeatureById(item)
    })
    .filter(Boolean)
}
