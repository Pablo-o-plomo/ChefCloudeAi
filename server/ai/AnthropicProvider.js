/**
 * Anthropic API Provider
 * Supports claude-3-5-sonnet, claude-3-opus, etc.
 *
 * Features:
 * - Text generation
 * - Streaming
 * - Token counting
 *
 * Limitations (as of 2026-06-21):
 * - Vision API not yet available (planned Q2-Q3 2026)
 */

import { AIProvider } from './AIProvider.js'

export class AnthropicProvider extends AIProvider {
  constructor(apiKey, model = 'claude-3-5-sonnet-20241022') {
    super()
    this.apiKey = apiKey
    this.model = model
    this.apiUrl = 'https://api.anthropic.com/v1'
    this.apiVersion = '2023-06-01'
  }

  async generateText(prompt, options = {}) {
    const model = options.model || this.model
    const maxTokens = options.maxTokens || 2000

    const response = await fetch(`${this.apiUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': this.apiVersion,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Anthropic API error (${response.status}): ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.content?.[0]?.text || ''
  }

  async analyzeImage(image, prompt, options = {}) {
    // Vision API not available yet
    throw new Error('Vision API not yet available for Anthropic (planned Q2-Q3 2026)')
  }

  async *generateStream(prompt, options = {}) {
    const model = options.model || this.model
    const maxTokens = options.maxTokens || 2000

    const response = await fetch(`${this.apiUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': this.apiVersion,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Anthropic streaming error: ${error.error?.message || 'Unknown error'}`)
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
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'content_block_delta') {
                const delta = data.delta
                if (delta.type === 'text_delta') {
                  yield delta.text
                }
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6))
          if (data.type === 'content_block_delta') {
            const delta = data.delta
            if (delta.type === 'text_delta') {
              yield delta.text
            }
          }
        } catch {
          // Skip
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  countTokens(text) {
    // Rough estimation: ~4 characters = 1 token
    return Math.ceil(text.length / 4)
  }

  getInfo() {
    return {
      name: 'Anthropic',
      model: this.model,
      vision: false, // Not yet available
      maxContextTokens: this._getMaxContextTokens(this.model),
      costPerMillionInputTokens: this._getCostInput(this.model),
      costPerMillionOutputTokens: this._getCostOutput(this.model),
    }
  }

  _getMaxContextTokens(model) {
    const contextMap = {
      'claude-3-5-sonnet-20241022': 200000,
      'claude-3-opus-20250219': 200000,
      'claude-3-sonnet-20240229': 200000,
      'claude-3-haiku-20240307': 200000,
    }
    return contextMap[model] || 200000
  }

  _getCostInput(model) {
    const costMap = {
      'claude-3-5-sonnet-20241022': 3,
      'claude-3-opus-20250219': 15,
      'claude-3-sonnet-20240229': 3,
      'claude-3-haiku-20240307': 0.8,
    }
    return costMap[model] || 3
  }

  _getCostOutput(model) {
    const costMap = {
      'claude-3-5-sonnet-20241022': 15,
      'claude-3-opus-20250219': 75,
      'claude-3-sonnet-20240229': 15,
      'claude-3-haiku-20240307': 4,
    }
    return costMap[model] || 15
  }
}
