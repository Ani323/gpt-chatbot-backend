const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('GPT Chatbot Backend is live ✅');
});

// Chat route
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o', // or 'gpt-3.5-turbo' if cost/speed matters
        messages: [
          { role: 'system', content: 'You are a friendly wellness and fitness expert.' },
          { role: 'user', content: userMessage }
        ]
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
