import { requestJson } from './api.client.js'

/**
 * Gửi tin nhắn tới chatbot AI
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @returns {Promise<{message: string, actions: Array}>}
 */
export function sendChatMessage(messages) {
  return requestJson('/chatbot/message', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  })
}
