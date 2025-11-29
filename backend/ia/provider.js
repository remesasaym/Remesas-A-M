const gemini = require('./gemini')

async function assistantChat(messages) {
  return gemini.chat(messages)
}

async function identityVerify(payload) {
  return gemini.verifyIdentity(payload)
}

module.exports = { assistantChat, identityVerify }