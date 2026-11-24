import studioReferenceUrl from '../assets/studio_reference.jpg'

export function getReplicateToken() {
  const token =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_REPLICATE_API_TOKEN) ||
    (typeof process !== 'undefined' && (process.env?.VITE_REPLICATE_API_TOKEN || process.env?.REPLICATE_API_TOKEN)) ||
    ''
  return token.trim()
}

const MODEL = 'openai/gpt-image-2.5-sunburst'

export const REALISTIC_STUDIO_PROMPT = [
  'Image 1 is the subject vehicle: a real car.',
  'The last image is the exact architectural environment reference: a modern stone-walled driveway with warm natural sunlight, dappled tree shadows, and cobblestone pavers.',
  'Create one completely photorealistic commercial automotive photograph of the EXACT vehicle from the first image parked naturally in the paved courtyard setting of the reference backdrop.',
  'The vehicle MUST remain identical to the first image: exact make, model, paint color, wheels, trim, grille, headlights, and proportions.',
  'Place the car realistically on the stone pavers in front of the warm textured stone wall, with natural tyre contact shadows, ambient occlusion, and subtle warm afternoon sun highlights and dappled tree shadows matching the environment reference.',
  'Natural perspective, authentic 50mm full-frame automotive camera lens look, real-world depth of field.',
  'Clean, professional dealership inventory hero shot. Absolutely NO cartoonish, CGI, 3D, plastic, or synthetic AI appearance. No people, no other cars, no text, no watermark.'
].join(' ')

let cachedRefDataUrl = null
export async function getStudioReferenceDataUrl() {
  if (cachedRefDataUrl) return cachedRefDataUrl
  try {
    const res = await fetch(studioReferenceUrl)
    const blob = await res.blob()
    cachedRefDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Failed to load background reference image'))
      reader.readAsDataURL(blob)
    })
    return cachedRefDataUrl
  } catch (err) {
    console.warn('Could not load background reference image as dataUrl:', err)
    return studioReferenceUrl
  }
}

function replicatePath(url) {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return url.replace(/^https:\/\/api\.replicate\.com/, '/replicate-api')
  }
  return url
}

export async function generateStudioThumbnail(dataUrls, signal) {
  const token = getReplicateToken()
  if (!token) throw new Error('Missing VITE_REPLICATE_API_TOKEN in environment.')
  const images = dataUrls.filter(Boolean).slice(0, 2)
  if (!images.length) throw new Error('Upload at least one car photo first.')

  const bgReference = await getStudioReferenceDataUrl().catch(() => null)
  const inputImages = bgReference ? [...images, bgReference] : images

  const baseUrl = typeof window !== 'undefined' && window.location?.origin ? '/replicate-api' : 'https://api.replicate.com'
  const response = await fetch(`${baseUrl}/v1/models/${MODEL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({
      input: {
        prompt: REALISTIC_STUDIO_PROMPT,
        input_images: inputImages,
        aspect_ratio: '16:9',
        quality: 'medium',
        background: 'opaque',
        output_format: 'jpeg',
        output_compression: 92,
        number_of_images: 1,
      },
    }),
    signal,
  })

  let prediction = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(prediction?.detail || prediction?.error || `Replicate rejected the request (${response.status}).`)
  }

  while (prediction?.status === 'starting' || prediction?.status === 'processing') {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 2000)
      if (!signal) return
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer)
          reject(new DOMException('Cancelled', 'AbortError'))
        },
        { once: true }
      )
    })
    const poll = await fetch(replicatePath(prediction.urls.get), {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
    prediction = await poll.json().catch(() => null)
    if (!poll.ok) throw new Error(prediction?.detail || 'Could not check the prediction.')
  }

  if (prediction?.status !== 'succeeded') {
    throw new Error(prediction?.error || 'Replicate did not return an image.')
  }

  const output = prediction.output
  const url = Array.isArray(output) ? output[0] : output
  if (typeof url !== 'string') throw new Error('Replicate did not return an image URL.')

  let blob = null
  if (typeof window !== 'undefined') {
    try {
      const imageRes = await fetch(`/replicate-file?url=${encodeURIComponent(url)}`, { signal })
      if (imageRes.ok) blob = await imageRes.blob()
    } catch (_) {}
  }
  if (!blob) {
    const directRes = await fetch(url, { signal })
    if (!directRes.ok) throw new Error('The generated image could not be downloaded.')
    blob = await directRes.blob()
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('The generated image could not be read.'))
    reader.readAsDataURL(blob)
  })
  return dataUrl
}
