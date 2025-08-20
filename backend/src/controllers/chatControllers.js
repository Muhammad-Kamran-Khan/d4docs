import { getChatResponse } from '../services/gemini.js';

export const handleChatRequest = async (req, res) => {
    try {
        const { history } = req.body;
        if (!history || !Array.isArray(history)) {
            return res.status(400).json({ message: 'Invalid request body. History array is required.' });
        }

        // Pass only the history array.
        const aiResponse = await getChatResponse(history);

        if (aiResponse.success) {
            res.status(200).json({ message: 'Success', response: aiResponse.response });
        } else {
            res.status(500).json({ message: aiResponse.error });
        }
    } catch (error) {
        console.error('Error in AI chat controller:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};