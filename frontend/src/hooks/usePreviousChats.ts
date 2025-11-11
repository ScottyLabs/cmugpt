import type { Message } from "@/types/chat";
import { useState } from "react";


const mockChats: Record<string, Message[]> = {
        "Chat about Italian Restaurants": [
            {
                id: "1",
                role: "user",
                content: "Can you recommend some good Italian restaurants in New York City?",
                timestamp: new Date(),
            },
            {
                id: "2",
                role: "assistant",
                content: "Sure! Here are a few popular Italian restaurants in NYC:\n\n1. Carbone\n2. L'Artusi\n3. Osteria Morini\n4. Il Buco\n5. Marea\n\nWould you like more information about any of these?",
                timestamp: new Date(),
            },
        ],
        "Chat about Sushi Places": [
            {
                id: "1",
                role: "user",
                content: "What are the best sushi places in San Francisco?",
                timestamp: new Date(),
            },
            {
                id: "2",
                role: "assistant",
                content: "Some of the top sushi spots in San Francisco include:\n\n1. Sushi Ran\n2. Akiko's Restaurant\n3. Pabu Izakaya\n4. Omakase\n5. Kusakabe\n\nLet me know if you need more details on any of these!",
                timestamp: new Date(),
            },
        ],
    };

export const usePreviousChats = () => {
    const [chats, setChats] = useState<Record<string, Message[]>>(mockChats);

    return { chats };
}