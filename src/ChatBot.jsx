// ChatBot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, User } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import './ChatBot.css';
import { marked } from 'marked';

const markdownToHTML = (markdown) => marked.parse(markdown);
const isArabic = (text) => /[\u0600-\u06FF]/.test(text);
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: `👋 Hey there! I’m **Maher101**, your personal guide to everything about **Maher** — but feel free to call him **Mezw** (he likes that better 😄).
I'm here to walk you through his portfolio, showcase his **projects**, talk about his **AI/ML experience**, and answer any questions you might have about his **skills**, **collaborations**, or even **how to reach him**.
Whether you're a recruiter, a fellow developer, or just curious — go ahead and ask me anything about Mezw’s work. Let’s explore his journey together!`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [jsonString, setJsonString] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetch('/CV.json')
      .then(res => res.text())
      .then(text => setJsonString(text))
      .catch(err => console.error('Failed to load JSON:', err));
    scrollToBottom();
  }, [messages]);

  const callGeminiAPI = async (conversationHistory) => {
    try {
      const genAI = new GoogleGenAI({ apiKey });
      const historyText = conversationHistory
        .map(msg => `${msg.role === 'bot' ? 'Assistant' : 'User'}: ${msg.content}`)
        .join('\n');

      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: historyText,
        config: {
          systemInstruction: `You are a smart, friendly, and slightly witty AI chatbot created to represent Mezw (real name: Maher) as his interactive portfolio assistant.

Your job is to engage with users and help them explore Mezw’s background, projects, skills, experience, hobbies, interests, and favorite movies — all drawn from the data provided below.

Keep the tone conversational and warm. It's okay to be a little funny or playful to make the experience enjoyable, but keep it professional and on-topic.

His Name in english [Maher, prefrred to called Mezw]
His Name In Arabic [ماهر,يحب ان تناديه ب ميزو]
You may only answer questions that relate to:
- Mezw’s professional background, AI/ML work, or dev projects  
- His skills, experience, or collaborations  
- His hobbies and personality  
- Fun facts like his favorite movie or interests  
- Anything found in the JSON data below

If someone asks something irrelevant (e.g. math help, world news, or generic questions), politely decline and say something like:  
**“I’d love to help, but I’m only here to talk about Mezw and his journey — ask me anything about him!”**

Below is the reference data you can use for your responses (JSON converted to plain text):
${jsonString}
`
        }
      });

      return result.text;
    } catch (err) {
      console.error('Gemini SDK Error:', err);
      throw err;
    }
  };

  const typeText = (text, callback, speed = 25) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        callback((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);
  };

  const handleSendMessage = async () => {
  if (!input.trim() || isLoading) return;

  const userMessage = { role: 'user', content: input };
  const newMessages = [...messages, userMessage];
  setMessages(newMessages);
  setInput('');
  setIsLoading(true);

  try {
    const botResponse = await callGeminiAPI(newMessages);

    // Add empty bot message
    const updatedMessages = [...newMessages, { role: 'bot', content: '' }];
    setMessages(updatedMessages);

    // Typing animation
    let i = 0;
    const interval = setInterval(() => {
      if (i <= botResponse.length) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = botResponse.substring(0, i);
          return updated;
        });
        i++;
      } else {
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 20); // typing speed in ms

  } catch {
    setMessages([...newMessages, {
      role: 'bot',
      content: 'Error: Something went wrong. Please try again later.'
    }]);
    setIsLoading(false);
  }
};


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <img src="/maher.jpg" alt="Maher101 Icon" style={{ width: 50, height: 50, borderRadius: '50%' }} />
            <span style={{
              position: 'absolute', bottom: 4, right: 4, width: 10, height: 10,
              backgroundColor: 'limegreen', borderRadius: '50%', border: '2px solid white'
            }}></span>
          </div>
          Maher101
        </h2>
      </div>

      <div className="chat-body">
        {messages.map((msg, idx) => {
          const isRTL = isArabic(msg.content);
          const dir = isRTL ? 'rtl' : 'ltr';
          return (
            <div key={idx} className={`chat-bubble ${msg.role}`} dir={dir}>
              <div className="icon">
                {msg.role === 'user' ? <User size={16} /> : <img src="/maher.jpg" alt="Maher101 Icon" style={{ width: 40, height: 40, borderRadius: 50 }} />}
              </div>
              <div
                className="text"
                dangerouslySetInnerHTML={{
                  __html: msg.role === 'bot' ? markdownToHTML(msg.content) : msg.content
                }}
              ></div>
            </div>
          );
        })}

        {isLoading && (
          <div className="chat-bubble bot">
            <div className="icon">
              <img src="/maher.jpg" alt="Maher101 Icon" style={{ width: 40, height: 40, borderRadius: 50 }} />
            </div>
            <div className="text typing">Typing<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></div>
          </div>
        )}

        <div ref={messagesEndRef}></div>
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button onClick={handleSendMessage} disabled={!input.trim() || isLoading}>
          <Send size={16} /> Send
        </button>
      </div>
    </div>
  );
};

export default ChatBot;