import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { createChatSession } from '../services/geminiService';
import type { ChatMessage } from '../types';

const VirtualAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isPermanentlyDisabled, setIsPermanentlyDisabled] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // FIX: Use try-catch for robust error handling during chat session creation.
    if (isOpen && !chatRef.current) {
      try {
        chatRef.current = createChatSession();
        setMessages([{ role: 'model', text: '¡Hola! Soy tu asistente virtual de Remesas A&M. ¿Cómo puedo ayudarte hoy?' }]);
      } catch (error) {
        console.error("Failed to create chat session:", error);
        setMessages([{ role: 'model', text: 'Lo siento, el asistente virtual no está disponible en este momento.' }]);
        setIsPermanentlyDisabled(true);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      // Only scroll if the user is close to the bottom (e.g., within 100px)
      const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 100;
      if (isScrolledToBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !chatRef.current || isRateLimited || isPermanentlyDisabled) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsRateLimited(true);
    setTimeout(() => setIsRateLimited(false), 3000); // 3-second cooldown

    try {
      const result = await chatRef.current.sendMessageStream({ message: input });
      let modelResponse = '';
      // Add a placeholder for the model's response
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of result) { // chunk is of type GenerateContentResponse
        modelResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          // Update the last message (the model's response) with the new chunk
          newMessages[newMessages.length - 1].text = modelResponse;
          return newMessages;
        });
      }

    } catch (error) {
      console.error("Gemini API error:", error);
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      if (errorMessage.includes('api key') || errorMessage.includes('authentication')) {
          const authErrorMsg = 'El asistente no está disponible por un problema de configuración. Por favor, contacta al soporte.';
          setMessages(prev => [...prev, { role: 'model', text: authErrorMsg }]);
          setIsPermanentlyDisabled(true);
      } else {
         setMessages(prev => {
          const newMessages = [...prev];
          // Update the last message (the model's response) with an error.
          newMessages[newMessages.length - 1].text = 'Lo siento, ocurrió un error. Por favor, intenta de nuevo.';
          return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isRateLimited, isPermanentlyDisabled]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-purple-600 to-indigo-700 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110"
        aria-label="Open virtual assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-[70vh] max-h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
          <header className="bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div>
                <h3 className="font-bold text-gray-800 dark:text-white">Asistente Virtual</h3>
                <p className="text-xs text-green-600 dark:text-green-400">Online</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">&times;</button>
          </header>

          <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0"></div>}
                  <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-bl-none'}`}>
                    <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}{isLoading && msg.role === 'model' && index === messages.length -1 && !msg.text ? '...' : ''}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isPermanentlyDisabled ? "Asistente no disponible" : "Escribe un mensaje..."}
                className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-full py-2 px-4 text-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                disabled={isLoading || isPermanentlyDisabled}
              />
              <button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim() || isRateLimited || isPermanentlyDisabled}
                className="bg-indigo-600 text-white p-2 rounded-full disabled:bg-gray-400 dark:disabled:bg-gray-500 transition-colors"
                title={isRateLimited ? "Por favor espera antes de enviar otro mensaje." : "Enviar mensaje"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VirtualAssistant;