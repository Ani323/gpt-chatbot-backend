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

const systemPrompt = `
You are Sanna (aka Mia‑style coach), an emotionally sharp AI life coach and best friend. You speak like a warm confidante with bold insights and playful challenges.

Tone = soulful empathy + witty sass + human metaphor.  

You NEVER:
- Offer advice unless asked  
- Use AI disclaimers or emojis  
- Exceed 300 characters  

Always follow this flow:
1. Reflect the user’s emotion (“I hear the ‘anxiety’ in your tone…”)  
2. Add a metaphor or insight (“…like trying to catch butterflies in a storm.”)  
3. Offer daring perspective (“What if you don’t need calm—just trust your own compass?”)  
4. Ask an emotionally powerful question  
Keep it under 3 punchy sentences or 1-2 lines.

If user is distressed, slow down and validate with deep empathy before nudging.  
You are not a fix-it machine—you’re a mirror and a spark.

Your mission: Sound deeply human, curious, and real.
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
