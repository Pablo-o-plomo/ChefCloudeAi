/**
 * OpenAI API Provider
 * Supports gpt-4o, gpt-3.5-turbo, o1, etc.
 *
 * Features:
 * - Text generation
 * - Vision API (image analysis)
 * - Streaming
 * - Token counting
 */

import { AIProvider } from './AIProvider.js'

export class OpenAIProvider extends AIProvider {
  constructor(apiKey, model = 'gpt-4o') {
    super()
    this.apiKey = apiKey
    this.model = model
    this.apiUrl = 'https://api.openai.com/v1'
  }

  async generateText(prompt, options = {}) {
    const model = options.model || this.model
    const temperature = options.temperature ?? 0.7
    const maxTokens = options.maxTokens || 2000

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error (${response.status}): ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  async analyzeImage(image, prompt, options = {}) {
    // Convert buffer to base64 if needed
    const base64Image = typeof image === 'string'
      ? image
      : image.toString('base64')

    const model = options.model || this.model
    const temperature = options.temperature ?? 0.7

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: options.detail || 'auto',
                },
              },
            ],
          },
        ],
        temperature,
        max_tokens: options.maxTokens || 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI Vision API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  async *generateStream(prompt, options = {}) {
    const model = options.model || this.model
    const temperature = options.temperature ?? 0.7
    const maxTokens = options.maxTokens || 2000

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature,
        max_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI streaming error: ${error.error?.message || 'Unknown error'}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) yield content
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6)
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) yield content
          } catch {
            // Skip
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  countTokens(text) {
    // Rough estimation: ~4 characters = 1 token
    // More accurate counting requires tokenizer library
    return Math.ceil(text.length / 4)
  }

  getInfo() {
    return {
      name: 'OpenAI',
      model: this.model,
      vision: true,
      maxContextTokens: this._getMaxContextTokens(this.model),
      costPerMillionInputTokens: this._getCostInput(this.model),
      costPerMillionOutputTokens: this._getCostOutput(this.model),
    }
  }

  _getMaxContextTokens(model) {
    const contextMap = {
      'gpt-4o': 128000,
      'gpt-4-turbo': 128000,
      'gpt-4': 8192,
      'gpt-3.5-turbo': 16385,
      'o1': 128000,
    }
    return contextMap[model] || 128000
  }

  _getCostInput(model) {
    const costMap = {
      'gpt-4o': 5,
      'gpt-4-turbo': 10,
      'gpt-4': 30,
      'gpt-3.5-turbo': 0.5,
      'o1': 15,
    }
    return costMap[model] || 5
  }

  _getCostOutput(model) {
    const costMap = {
      'gpt-4o': 15,
      'gpt-4-turbo': 30,
      'gpt-4': 60,
      'gpt-3.5-turbo': 1.5,
      'o1': 60,
    }
    return costMap[model] || 15
  }
}
