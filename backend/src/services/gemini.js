import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not defined in the environment variables.");

// Define your system instruction here once
const systemInstructionContent = {
  role: "system",
  parts: [{ text: "You are an AI assistant. Please use Markdown formatting for your responses whenever appropriate. Use bold, italics, bullet points, and code blocks." }]
};

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL,
    systemInstruction: systemInstructionContent // This is the correct way
});

export const getChatResponse = async (history) => {
    try {
        // Clean the history to remove the extra 'id' field
        const cleanedHistory = history.map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: msg.parts
        }));

        // The chat session is started with the full cleaned history
        const chat = model.startChat({
            history: cleanedHistory,
        });

        const lastMessage = cleanedHistory[cleanedHistory.length - 1];

        const result = await chat.sendMessageStream(lastMessage.parts);
        
        let fullText = '';
        for await (const chunk of result.stream) {
            fullText += chunk.text();
        }
        
        return { success: true, response: fullText };
    } catch (error) {
        console.error("Gemini API error:", error);
        return { success: false, error: "An error occurred while communicating with the AI." };
    }
};