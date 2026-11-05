
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const Groq = require('groq-sdk');

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

app.get('/', (req, res) => {
    res.send('TravelMate AI Backend is Running!');
});

app.post('/api/generate-trip', async (req, res) => {
    try {
        const { destination, startDate, endDate, budget, preference } = req.body;

        if (!destination || !startDate || !endDate || !budget) {
            return res.status(400).json({
                error: 'Please provide all trip details.'
            });
        }

        const prompt = `
        Create a personalised travel itinerary.

        Destination: ${destination}
        Start Date: ${startDate}
        End Date: ${endDate}
        Budget: Rs. ${budget}
        Preference: ${preference}

        Include:
        1. Day-wise itinerary.
        2. Tourist attractions.
        3. Activities.
        4. Estimated expenses in Indian Rupees.
        5. Travel tips.

        Keep the plan within the budget.
        Use simple language and clear headings.
        `;

        const response = await groq.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            messages: [
                {
                    role: 'system',
                    content: 'You are an intelligent travel planning assistant.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_completion_tokens: 1500,
            temperature: 0.7
        });

        let reminders = [];

        // Connect to n8n and receive reminders
        try {
            const n8nResponse = await fetch(
                'https://travelmate-ai.app.n8n.cloud/webhook/travelmate-reminders',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        destination,
                        startDate,
                        endDate,
                        budget,
                        preference
                    }),
                    signal: AbortSignal.timeout(10000)
                }
            );

            const n8nData = await n8nResponse.json();

            console.log('n8n status:', n8nResponse.status);
            console.log('n8n data:', n8nData);

            if (n8nResponse.ok && Array.isArray(n8nData.reminders)) {
                reminders = n8nData.reminders;
            }

        } catch (n8nError) {
            console.log('n8n connection issue:', n8nError.message);
        }

        res.json({
            itinerary: response.choices[0].message.content,
            reminders: reminders
        });

    } catch (error) {
        console.error('Groq API Error:', error.message);

        res.status(500).json({
            error: 'Unable to generate itinerary. Please check the backend terminal.'
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`TravelMate AI server running on port ${PORT}`);
});
