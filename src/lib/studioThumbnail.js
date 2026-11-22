const REPLICATE_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN
const MODEL = 'openai/gpt-image-2.5-sunburst'

const PROMPT = [
  'The uploaded photos are the same car. Use them as reference.',
  'Make one photorealistic automotive studio photo of that exact car.',
  'Keep the vehicle identical: same body, paint colour, wheels, badges, lights, mirrors, glass, number plate and proportions.',
  'Do not redesign, restyle, add parts, or change the car in any way.',
  'Zoom out. The car should sit smaller in the frame, centred, with the full roof, mirrors, bumpers and all four wheels clearly inside the picture.',
  'Leave empty studio space around it: a clear margin above the roof, space on both sides, and space below the tyres. Do not crop the car and do not let it fill the frame.',
  'Replace only the surroundings with a real dealership studio: seamless light grey cyclorama, soft even lighting, a faint floor reflection and a natural contact shadow under the tyres.',
  'No people, no other cars, no text, no watermark.',
].join(' ')

function replicatePath(url) {
  return url.replace(/^https:\/\/api\.replicate\.com/, '/replicate-api')
}

export async function generateStudioThumbnail(dataUrls, signal) {
  if (!REPLICATE_TOKEN) throw new Error('Missing VITE_REPLICATE_API_TOKEN.')
  const images = dataUrls.filter(Boolean).slice(0, 3)
  if (!images.length) throw new Error('Upload at least one car photo first.')

  const response = await fetch(`/replicate-api/v1/models/${MODEL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REPLICATE_TOKEN}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({
      input: {
        prompt: PROMPT,
        input_images: images,
        aspect_ratio: 'auto',
        quality: 'low',
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
      headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` },
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

  const imageRes = await fetch(`/replicate-file?url=${encodeURIComponent(url)}`, { signal })
  if (!imageRes.ok) throw new Error('The generated image could not be downloaded.')
  const blob = await imageRes.blob()
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('The generated image could not be read.'))
    reader.readAsDataURL(blob)
  })
  return dataUrl
}
