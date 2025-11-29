const { GoogleGenerativeAI } = require('@google/generative-ai')

// Singleton client instance
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.API_KEY)

async function assistantChat(messages) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  // Convertir formato de mensajes
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({
    history: history,
    generationConfig: {
      maxOutputTokens: 500,
    },
  });

  const result = await chat.sendMessage(lastMessage.text);
  const response = await result.response;
  const text = response.text();

  return { text }
}

async function verifyIdentity({
  idDocBase64, idDocMimeType,
  addressDocBase64, addressDocMimeType,
  selfieBase64, selfieMimeType,
  country, addressText
}) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const countryName = country || ''

  // Default to jpeg if missing, but prefer passed mimeType
  const idMime = idDocMimeType || 'image/jpeg';
  const addrMime = addressDocMimeType || 'image/jpeg';
  const selfieMime = selfieMimeType || 'image/jpeg';

  const idRes = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: idMime, data: idDocBase64 } },
        {
          text: `Analiza este documento de identidad. El usuario afirma residir en ${countryName}. Tu tarea es triple:
1. Autenticidad: Busca signos de falsificación.
2. País: Confirma si pertenece a ${countryName}; solo marca falso si ves evidencia clara de otro país.
3. Datos: Extrae el número de identificación y verifica si está vencido.
Responde estrictamente con un objeto JSON: {"is_authentic": boolean, "is_expired": boolean, "is_from_country": boolean, "document_id": "string"}.` }
      ]
    }]
  })

  const addrRes = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: addrMime, data: addressDocBase64 } },
        { text: `Verifica si este documento contiene la siguiente dirección: "${addressText || ''}". Considera equivalencias comunes y orden. Responde en JSON: {"address_matches": boolean}.` }
      ]
    }]
  })

  const faceRes = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: selfieMime, data: selfieBase64 } },
        { text: 'Selfie del usuario.' },
        { inlineData: { mimeType: idMime, data: idDocBase64 } },
        { text: 'Compara biométricamente la selfie con la foto del documento de identidad. Responde en JSON: {"faces_match": boolean}.' }
      ]
    }]
  })

  function parseJson(s) {
    try {
      if (!s) return {};
      // Extract JSON from markdown code blocks or raw text
      const match = s.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return JSON.parse(s);
    } catch (e) {
      console.error("Error parsing JSON from AI:", e);
      console.error("Raw response:", s);
      return {};
    }
  }

  const id = parseJson(idRes.response.text())
  const address = parseJson(addrRes.response.text())
  const face = parseJson(faceRes.response.text())

  return { id, address, face }
}

module.exports = { assistantChat, verifyIdentity }