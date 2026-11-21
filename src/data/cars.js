import hatchbackImg from '../assets/car_body_type_images/hatchback.png'
import sedanImg from '../assets/car_body_type_images/sedan.png'
import suvImg from '../assets/car_body_type_images/suv.png'
import mpvImg from '../assets/car_body_type_images/mpv_muv.png'

export const brandLogos = [
  { name: 'Honda', logo: '/brands/honda.png' },
  { name: 'Maruti Suzuki', logo: '/brands/maruti-suzuki.png' },
  { name: 'Hyundai', logo: '/brands/hyundai.png' },
  { name: 'Tata', logo: '/brands/tata.png' },
  { name: 'Mahindra', logo: '/brands/mahindra.png' },
  { name: 'Toyota', logo: '/brands/toyota.png' },
  { name: 'Kia', logo: '/brands/kia.png' },
  { name: 'BMW', logo: '/brands/bmw.png' },
  { name: 'Volkswagen', logo: '/brands/volkswagen.png' },
  { name: 'Skoda', logo: '/brands/skoda.png' },
  { name: 'MG', logo: '/brands/mg.png' },
  { name: 'Renault', logo: '/brands/renault.png' },
  { name: 'Ford', logo: '/brands/ford.png' },
  { name: 'Jeep', logo: '/brands/jeep.png' },
  { name: 'Nissan', logo: '/brands/nissan.png' },
  { name: 'Audi', logo: '/brands/audi.png' },
  { name: 'Mercedes-Benz', logo: '/brands/mercedes-benz.png' },
]

export const bodyTypesData = [
  {
    id: 'hatchback',
    name: 'Hatchback',
    image: hatchbackImg,
    startingPrice: 'Explore',
  },
  {
    id: 'sedan',
    name: 'Sedan',
    image: sedanImg,
    startingPrice: 'Explore',
  },
  {
    id: 'suv',
    name: 'SUV',
    image: suvImg,
    startingPrice: 'Explore',
  },
  {
    id: 'mpv',
    name: 'MPV',
    image: mpvImg,
    startingPrice: 'Explore',
  },
]

// Zero mock data - site is 100% database driven
export const featuredCarData = null
export const allCarsData = []
