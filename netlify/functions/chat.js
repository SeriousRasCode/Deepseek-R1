exports.handler = async (event) => {
    try {
        const { message, model } = JSON.parse(event.body);
        
        const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': event.headers.referer,
                'X-Title': 'Netlify Chat App'
            },
            body: JSON.stringify({
                model: model,
                messages: [{
                    role: 'user',
                    content: message
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: data.error?.message || 'API Error' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: data.choices[0].message.content })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};