import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const FLUX_KLEIN_PROMPT = [
  'The uploaded photos are the same car. Use them as reference.',
  'Make one photorealistic automotive studio photo of that exact car.',
  'Keep the vehicle identical: same body, paint colour, wheels, badges, lights, mirrors, glass, number plate and proportions.',
  'Do not redesign, restyle, add parts, or change the car in any way.',
  'Zoom out. The car should sit smaller in the frame, centred, with the full roof, mirrors, bumpers and all four wheels clearly inside the picture.',
  'Leave empty studio space around it: a clear margin above the roof, space on both sides, and space below the tyres.',
  'Replace only the surroundings with a real dealership studio: seamless light grey cyclorama, soft even lighting, a faint floor reflection and a natural contact shadow under the tyres.',
  'No people, no other cars, no text, no watermark.',
].join(' ')

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function fluxKleinRoute() {
  return {
    name: 'flux-klein-route',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      if (env.AI_GATEWAY_API_KEY) process.env.AI_GATEWAY_API_KEY = env.AI_GATEWAY_API_KEY

      server.middlewares.use('/api/flux-klein', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('POST only')
          return
        }
        try {
          const raw = await readRequestBody(req)
          const body = JSON.parse(raw || '{}')
          const images = Array.isArray(body.images) ? body.images.filter(Boolean).slice(0, 3) : []
          if (!images.length) {
            res.statusCode = 400
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: 'Upload a car photo first.' }))
            return
          }
          const { generateImage } = await import('ai')
          const result = await generateImage({
            model: 'bfl/flux-3-image-klein',
            prompt: { text: FLUX_KLEIN_PROMPT, images },
            aspectRatio: '3:2',
            providerOptions: {
              blackForestLabs: { resolution: '1k', outputFormat: 'jpeg' },
            },
          })
          const mediaType = result.image.mediaType || 'image/jpeg'
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ image: `data:${mediaType};base64,${result.image.base64}` }))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Image generation failed' }))
        }
      })
    },
  }
}

function replicateFileProxy() {
  return {
    name: 'replicate-file-proxy',
    configureServer(server) {
      server.middlewares.use('/replicate-file', async (req, res) => {
        try {
          const target = new URL(req.url || '', 'http://localhost').searchParams.get('url')
          const allowed = target && /^https:\/\/([a-z0-9-]+\.)*replicate\.delivery\//.test(target)
          if (!allowed) {
            res.statusCode = 400
            res.end('Unsupported image URL')
            return
          }
          const upstream = await fetch(target)
          res.statusCode = upstream.status
          const type = upstream.headers.get('content-type')
          if (type) res.setHeader('content-type', type)
          res.end(Buffer.from(await upstream.arrayBuffer()))
        } catch (err) {
          res.statusCode = 502
          res.end(err instanceof Error ? err.message : 'Proxy failed')
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), replicateFileProxy(), fluxKleinRoute()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    proxy: {
      '/replicate-api': {
        target: 'https://api.replicate.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/replicate-api/, ''),
      },
    },
  },
})
