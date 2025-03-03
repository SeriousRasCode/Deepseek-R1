exports.handler = async (event) => {
    try {
        // 1. Validate Request
        if (!event.body) {
            return formatResponse(400, { error: "Empty request body" });
        }

        let params;
        try {
            params = JSON.parse(event.body);
        } catch (e) {
            return formatResponse(400, { error: "Invalid JSON format" });
        }

        const { message, model = 'deepseek/deepseek-r1:free' } = params;
        if (!message || typeof message !== 'string') {
            return formatResponse(400, { error: "Message is required" });
        }

        // 2. Verify API Key
        if (!process.env.OPENROUTER_API_KEY) {
            console.error("Missing API key");
            return formatResponse(500, { error: "Server configuration error" });
        }

        // 3. Make API Call with Timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': event.headers.origin || 'https://your-site.netlify.app',
                'X-Title': 'DeepSeek Assistant'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: message }],
                temperature: 0.7,
                max_tokens: 1000
            }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        // 4. Handle API Response
        const data = await response.json();
        
        if (!response.ok) {
            console.error("API Error:", data);
            return formatResponse(response.status, { 
                error: data.error?.message || `API Error: ${response.statusText}` 
            });
        }

        if (!data.choices?.[0]?.message?.content) {
            return formatResponse(500, { error: "Invalid response format" });
        }

        // 5. Successful Response
        return formatResponse(200, { reply: data.choices[0].message.content });

    } catch (error) {
        console.error("Unhandled Error:", error);
        return formatResponse(500, { 
            error: error.name === 'AbortError' 
                ? "Request timed out" 
                : "Internal server error"
        });
    }
};

// Helper function for standardized responses
const formatResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(body)
});