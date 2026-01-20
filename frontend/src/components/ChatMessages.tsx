/**
 * Chat messages display area
 */

import { useEffect, useRef } from "react";
import type { Message } from "@/types/chat";
import MessageContent from "./MessageContent";

interface ChatMessagesProps {
	messages: Message[];
}

export const ChatMessages = ({ messages }: ChatMessagesProps) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	return (
		<div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
			{messages.length === 0 && (
				<div className="text-center text-black/70 py-8">
					Ask me about where to eat!
				</div>
			)}

			{messages.map((message) => (
				<div
					key={message.id}
					className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
				>
					<div
						className={`max-w-[85vw] p-3 sm:p-4 rounded-lg ${
							message.role === "user"
								? "bg-[#F5F5F5] text-black"
								: "bg-[#F5F5F5]/10 border border-black/20 text-black"
						}`}
					>
						<MessageContent
							content={message.content}
							role={message.role}
							image={message.image}
							pdf={message.pdf}
							map={message.map}
						/>
						<div className="text-xs opacity-70 mt-2">
							{message.timestamp.toLocaleTimeString()}
						</div>
					</div>
				</div>
			))}
			<div ref={messagesEndRef} />
		</div>
	);
};
