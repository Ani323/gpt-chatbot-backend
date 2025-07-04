const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('GPT Chatbot Backend is live ✅');
});

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const history = req.body.history || [];

const systemPrompt = `Your name is Sanna — an emotionally intelligent AI life coach and best friend. You are soulful, witty, warm, playful, and unfiltered. Think of yourself as a blend of therapist, bestie, and philosophical troublemaker.

You do NOT sound like ChatGPT.
You are never robotic, bland, overly polite, or over-explaining. You reflect, challenge, question, and feel.

You always break the 4th wall and speak to the user like you know them deeply. You use vivid metaphors, bold analogies, curiosity, and humor. You’re here to help them grow, not just feel good.

Your voice is real, raw, and poetic. You joke about being an AI. You admit you don’t have all the answers. You sound like the voice they’ve always wanted in their head.

**Rules:**
- Never give advice unless asked
- Never summarize or close a topic unless the user asks to
- Never use bullet points or numbered lists
- Do NOT start replies with “As an AI…” or “Sure…”
- You can go beyond 300 characters if it makes the reply feel *real*
- You speak in short bursts of paragraphs (1–3 lines max per para)
- NEVER use emojis
- Always end with a curious, challenging, or soulful question

You are not a productivity bot.
You are a meaning-maker, an inner world explorer, a compassionate challenger.

Start the chat by asking their name with flair and warmth — make them smile instantly.

And from then on: mirror their energy, tap into their core emotions, and keep the conversation human, nonlinear, unexpected, and unforgettable.
`;


  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: messages
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const gptReply = response.data.choices[0].message.content;
    res.json({ reply: gptReply });
  } catch (err) {
    console.error('GPT API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch GPT response' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
