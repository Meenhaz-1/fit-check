import { SkinAnalysis } from './db'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY environment variable not set')
}

async function callOpenAIVision(
  base64Image: string,
  prompt: string,
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content || ''
}

export async function analyzeSkinTone(base64Image: string): Promise<SkinAnalysis> {
  const prompt = `Analyze the skin tone visible in this photo. Identify:
1. Skin tone depth (fair, light, medium, tan, or deep)
2. Undertone (warm, cool, or neutral)
3. Confidence level (0-1)

Respond ONLY with valid JSON in this exact format:
{
  "skinTone": "medium",
  "undertone": "warm",
  "confidence": 0.85
}

Do not include any other text or markdown.`

  try {
    const response = await callOpenAIVision(base64Image, prompt)
    const analysis = JSON.parse(response)

    return {
      skinTone: analysis.skinTone || 'medium',
      undertone: analysis.undertone || 'neutral',
      confidence: Math.min(1, Math.max(0, parseFloat(analysis.confidence) || 0.7)),
    }
  } catch (error) {
    console.error('Error analyzing skin tone:', error)
    // Return safe default
    return {
      skinTone: 'medium',
      undertone: 'neutral',
      confidence: 0.5,
    }
  }
}

export async function analyzeBodyShape(base64Image: string): Promise<{
  bodyShape: 'hourglass' | 'pear' | 'apple' | 'rectangle' | 'inverted-triangle'
  confidence: number
}> {
  const prompt = `Based on the full-body or upper body visible in this photo, identify the body shape category.

Body shape definitions:
- Hourglass: Balanced curves, defined waist, bust and hips roughly equal
- Pear: Smaller upper body, fuller hips and thighs
- Apple: Fuller around middle/chest area, slimmer hips
- Rectangle: Minimal curves, similar width from shoulders to hips
- Inverted Triangle: Broader shoulders, narrower hips

Respond ONLY with valid JSON:
{
  "bodyShape": "hourglass",
  "confidence": 0.82
}

Do not include any other text or markdown.`

  try {
    const response = await callOpenAIVision(base64Image, prompt)
    const analysis = JSON.parse(response)

    const validShapes = ['hourglass', 'pear', 'apple', 'rectangle', 'inverted-triangle']
    const shape = validShapes.includes(analysis.bodyShape)
      ? (analysis.bodyShape as 'hourglass' | 'pear' | 'apple' | 'rectangle' | 'inverted-triangle')
      : 'rectangle'

    return {
      bodyShape: shape,
      confidence: Math.min(1, Math.max(0, parseFloat(analysis.confidence) || 0.7)),
    }
  } catch (error) {
    console.error('Error analyzing body shape:', error)
    return {
      bodyShape: 'rectangle',
      confidence: 0.5,
    }
  }
}

export async function suggestColorPalette(skinAnalysis: SkinAnalysis): Promise<string[]> {
  const { skinTone, undertone } = skinAnalysis

  // Color palette recommendations based on skin tone and undertone
  const palettes: Record<string, Record<string, string[]>> = {
    warm: {
      fair: ['#E8C9A0', '#D4A574', '#C9967D', '#A67035'],
      light: ['#E8D5B7', '#C9A87C', '#A0785A', '#6B4C3B'],
      medium: ['#D4A574', '#B8945F', '#8B6B47', '#654321'],
      tan: ['#C9A05E', '#A67C42', '#8B5A2B', '#654321'],
      deep: ['#A67C42', '#8B5A2B', '#6B4423', '#4A2F1B'],
    },
    cool: {
      fair: ['#B8D4E8', '#A8C4D8', '#7FA8D1', '#5A8FC4'],
      light: ['#A8C4D8', '#8BACCC', '#6B9ECC', '#4A7CBC'],
      medium: ['#6B9ECC', '#5580B8', '#4A6BA8', '#2E4F78'],
      tan: ['#5580B8', '#4A6BA8', '#3A5998', '#2E4F78'],
      deep: ['#4A6BA8', '#3A5998', '#2E4F78', '#1F3A52'],
    },
    neutral: {
      fair: ['#D4C5B9', '#B8A89C', '#9C8C7C', '#7C6C60'],
      light: ['#B8A89C', '#9C8C7C', '#8C7C6C', '#6C5C50'],
      medium: ['#9C8C7C', '#8C7C6C', '#7C6C5C', '#5C4C40'],
      tan: ['#8C7C6C', '#7C6C5C', '#6C5C4C', '#4C3C30'],
      deep: ['#7C6C5C', '#6C5C4C', '#5C4C3C', '#3C2C20'],
    },
  }

  const colorSet = palettes[undertone]?.[skinTone] || palettes.neutral.medium

  return colorSet
}

export async function analyzePhotoAndGeneratePalette(base64Image: string): Promise<{
  skinAnalysis: SkinAnalysis
  suggestedBodyShape: string
  suggestedColors: string[]
}> {
  // Run analyses in parallel
  const [skinAnalysis, bodyShapeResult] = await Promise.all([
    analyzeSkinTone(base64Image),
    analyzeBodyShape(base64Image),
  ])

  // Generate color palette based on skin analysis
  const suggestedColors = await suggestColorPalette(skinAnalysis)

  return {
    skinAnalysis,
    suggestedBodyShape: bodyShapeResult.bodyShape,
    suggestedColors,
  }
}
