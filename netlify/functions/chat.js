exports.handler = async (event) => {
    try {
        // Validate request
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Empty request body" })
            };
        }

        const { message, model } = JSON.parse(event.body);
        
        if (!message || typeof message !== 'string') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid message format" })
            };
        }

        // Make API request
        const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': event.headers.origin || 'https://your-site.netlify.app',
                'X-Title': 'DeepSeek-R1 Assistant'
            },
            body: JSON.stringify({
                model: model || 'deepseek/deepseek-r1:free',
                messages: [{
                    role: 'user',
                    content: message
                }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        // Handle API errors
        if (!response.ok) {
            const errorData = await response.json();
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: errorData.error?.message || 'API Error' })
            };
        }

        const data = await response.json();
        
        if (!data.choices?.[0]?.message?.content) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Invalid response format" })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                reply: data.choices[0].message.content
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};