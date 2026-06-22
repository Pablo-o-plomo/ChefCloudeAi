/**
 * AI Provider Factory
 * Creates appropriate provider instance based on configuration
 *
 * Environment variables:
 * - AI_PROVIDER: 'openai' | 'anthropic' (default: 'openai')
 * - OPENAI_API_KEY: OpenAI API key
 * - OPENAI_MODEL: Model name (default: 'gpt-4o')
 * - ANTHROPIC_API_KEY: Anthropic API key
 * - ANTHROPIC_MODEL: Model name (default: 'claude-3-5-sonnet-20241022')
 */

import { OpenAIProvider } from './OpenAIProvider.js'
import { AnthropicProvider } from './AnthropicProvider.js'

export class AIProviderFactory {
  /**
   * Create provider by name
   * @param {string} providerName - 'openai' or 'anthropic'
   * @param {string} apiKey
   * @param {string} model - Optional model name
   * @returns {AIProvider}
   */
  static create(providerName, apiKey, model) {
    const provider = (providerName || 'openai').toLowerCase()

    switch (provider) {
      case 'openai':
        return new OpenAIProvider(apiKey, model)

      case 'anthropic':
        return new AnthropicProvider(apiKey, model)

      default:
        throw new Error(`Unknown AI provider: ${providerName}. Supported: openai, anthropic`)
    }
  }

  /**
   * Create provider from environment variables
   * Reads: AI_PROVIDER, OPENAI_API_KEY, OPENAI_MODEL, ANTHROPIC_API_KEY, ANTHROPIC_MODEL
   * @returns {AIProvider}
   */
  static createFromEnv() {
    const provider = process.env.AI_PROVIDER || 'openai'

    if (provider.toLowerCase() === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable not set')
      }
      const model = process.env.OPENAI_MODEL || 'gpt-4o'
      return new OpenAIProvider(apiKey, model)
    }

    if (provider.toLowerCase() === 'anthropic') {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable not set')
      }
      const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
      return new AnthropicProvider(apiKey, model)
    }

    throw new Error(`Unknown AI_PROVIDER: ${provider}. Supported: openai, anthropic`)
  }

  /**
   * List available providers with metadata
   * @returns {array}
   */
  static listProviders() {
    return [
      {
        name: 'openai',
        displayName: 'OpenAI',
        models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1'],
        vision: true,
        description: 'OpenAI GPT models with Vision support for image analysis',
        defaultModel: 'gpt-4o',
        envKey: 'OPENAI_API_KEY',
      },
      {
        name: 'anthropic',
        displayName: 'Anthropic',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20250219'],
        vision: false,
        description: 'Anthropic Claude models (Vision support planned Q2-Q3 2026)',
        defaultModel: 'claude-3-5-sonnet-20241022',
        envKey: 'ANTHROPIC_API_KEY',
      },
    ]
  }

  /**
   * Get current provider info
   * @returns {object}
   */
  static getCurrentProviderInfo() {
    try {
      const provider = AIProviderFactory.createFromEnv()
      const info = provider.getInfo()
      return {
        ...info,
        providerName: process.env.AI_PROVIDER || 'openai',
        configured: true,
      }
    } catch (error) {
      return {
        configured: false,
        error: error.message,
      }
    }
  }

  /**
   * Check if provider supports vision
   * @returns {boolean}
   */
  static supportsVision() {
    try {
      const provider = AIProviderFactory.createFromEnv()
      return provider.getInfo().vision
    } catch {
      return false
    }
  }
}
