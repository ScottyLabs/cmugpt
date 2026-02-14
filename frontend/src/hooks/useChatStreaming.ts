/**
 * Custom hook for managing chat streaming
 * Unified hook that handles all streaming in one place
 */

import {
	queryOptions,
	experimental_streamedQuery as streamedQuery,
	useQuery,
} from "@tanstack/react-query";
import { useEffect } from "react";
import type { Message } from "@/types/chat";
import {
	extractContent,
	extractImage,
	parseStreamingMessage,
} from "@/utils/streamParser";

interface UseChatStreamingProps {
	chatMessages: Message[];
	lastMessage: string;
	onMessageUpdate: (content: string, image?: any) => void;
	token: string | null;
}

export const useChatStreaming = ({
	chatMessages,
	lastMessage,
	onMessageUpdate,
	token,
}: UseChatStreamingProps) => {;

	const streamingQuery = queryOptions({
		queryKey: ["chat", lastMessage, chatMessages.length],
		queryFn: streamedQuery({
			streamFn: async () => {
				const chat_history = chatMessages.map(
					({ role, content, image, audio, pdf }) => ({
						role,
						content,
						...(image && { image }),
						...(audio && { audio }),
						...(pdf && { pdf }),
					}),
				);

				const requestBody = {
					chat_history,
				};

				const response = await fetch(
					`${import.meta.env.VITE_API_URL}/chat_streaming`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json",
							"Authorization": `Bearer ${token}`
						 },
						body: JSON.stringify(requestBody),
					},
				);

				if (!response.body) {
					throw new Error("No response body for streaming");
				}

				const reader = response.body.getReader();
				return (async function* () {
					while (true) {
						const { done, value } = await reader.read();
						if (done) return;
						const decoded = new TextDecoder().decode(value);
						// Strip SSE "data: " prefix from each line
						const stripped = decoded
							.split("\n")
							.filter((line) => line.startsWith("data: "))
							.map((line) => line.slice(6))
							.filter((line) => line !== "[DONE]")
							.join("");
						if (stripped) yield stripped;
					}
				})();
			},
		}),
		enabled: chatMessages.length > 0,
		refetchInterval: Infinity,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		retry: false,
	});

	const {
		data: streamingMessage,
		isFetching,
		isPending,
	} = useQuery(streamingQuery);

	useEffect(() => {
		if (!streamingMessage) return;

		try {
			const messages = parseStreamingMessage(streamingMessage);

			// Extract content and image
			const accContent = extractContent(messages);
			const assistantImage = extractImage(messages);

			if (accContent || assistantImage) {
				onMessageUpdate(accContent, assistantImage);
			}
		} catch (error) {
			console.error(
				"Error parsing streaming message:",
				error,
				streamingMessage,
			);
		}
	}, [streamingMessage, onMessageUpdate]);

	return {
		currentlyStreaming: isFetching,
		currentlySending: isPending,
	};
};
