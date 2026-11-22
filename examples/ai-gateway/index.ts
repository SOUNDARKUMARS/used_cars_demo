import { generateText } from 'ai'

const { text } = await generateText({
  model: 'google/gemini-2.5-flash-lite',
  prompt: 'Invent a new holiday and describe its traditions.',
})

console.log(text)
