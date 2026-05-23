require('dotenv').config();
const express = require('express');
const Groq = require('groq-sdk');
const { fetchARDDProgram } = require('./scraper');
const { buildSchedule } = require('./scheduler');

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.json());
app.use(express.static('public'));

async function explainSession(session, profile) {
  try {
    const chat = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: `You are an expert conference advisor for ARDD, the Aging Research and Drug Discovery conference.
          
Attendee profile:
- Name: ${profile.name}
- Role: ${profile.role}
- Goal: ${profile.goal}
- Research focus: ${profile.focus}
- Interests: ${(profile.interests || []).join(', ')}

Session: "${session.raw}"

In 1-2 sentences, explain specifically why this session is valuable for this attendee given their goals. Be concrete and specific to the science or business context. Do not start with "This session".`
        }
      ],
      max_tokens: 100
    });
    return chat.choices[0].message.content.trim();
  } catch (err) {
    console.error('Groq error:', err);
    return 'Relevant to your research focus and conference goals.';
  }
}

app.post('/api/schedule', async (req, res) => {
  const profile = req.body;
  const sessions = await fetchARDDProgram();
  const schedule = buildSchedule(sessions, profile);
  
  // Add AI explanations to top 5 sessions
  const top5 = schedule.slice(0, 5);
  const rest = schedule.slice(5);

  const explained = await Promise.all(
    top5.map(async (session) => ({
      ...session,
      explanation: await explainSession(session, profile)
    }))
  );

  const finalSchedule = [
    ...explained,
    ...rest.map(s => ({ ...s, explanation: null }))
  ];

  res.json({ profile, schedule: finalSchedule });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});