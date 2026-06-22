/**
 * Abstract AIProvider interface
 * Defines contract for all AI provider implementations
 *
 * Implementations:
 * - OpenAIProvider
 * - AnthropicProvider
 * - Future: GoogleProvider, CohereProvider, etc.
 */

export class AIProvider {
  /**
   * Generate text response
   * @param {string} prompt
   * @param {object} options - { temperature, maxTokens, model }
   * @returns {Promise<string>}
   */
  async generateText(prompt, options = {}) {
    throw new Error('generateText() not implemented')
  }

  /**
   * Analyze image with vision capability
   * @param {string|Buffer} image - base64 string or buffer
   * @param {string} prompt
   * @param {object} options
   * @returns {Promise<string>}
   * @throws if provider doesn't support vision
   */
  async analyzeImage(image, prompt, options = {}) {
    throw new Error('analyzeImage() not supported by this provider')
  }

  /**
   * Stream text response (for real-time chat)
   * @param {string} prompt
   * @param {object} options
   * @yields {string} response chunks
   */
  async *generateStream(prompt, options = {}) {
    throw new Error('generateStream() not implemented')
  }

  /**
   * Estimate token count
   * @param {string} text
   * @returns {number}
   */
  countTokens(text) {
    throw new Error('countTokens() not implemented')
  }

  /**
   * Get provider metadata
   * @returns {object} { name, model, vision, maxContextTokens, costPerMillionInputTokens, ... }
   */
  getInfo() {
    throw new Error('getInfo() not implemented')
  }
}
