import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import "highlight.js/styles/github-dark.css";

import { ChatInput } from "@/components/ChatInput";
import { ChatMessages } from "@/components/ChatMessages";
// Components
import { Sidebar } from "@/components/Sidebar";
// Hooks
import { useChatStreaming } from "@/hooks/useChatStreaming";
// Types
import type { ImageData, Message, PdfData } from "@/types/chat";

export const Route = createFileRoute("/")({
	component: ChatDemo,
});
function ChatDemo() {
	// State management
	const [chatMessages, setChatMessages] = useState<Message[]>([]);
	const [lastMessage, setLastMessage] = useState<string>("");
	const [inputValue, setInputValue] = useState("");
	const [uploadedImage, setUploadedImage] = useState<ImageData | null>(null);
	const [uploadedPdf, setUploadedPdf] = useState<PdfData | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(false);

	// Streaming chat - unified streaming handler
	const { currentlyStreaming, currentlySending } = useChatStreaming({
		chatMessages,
		lastMessage,
		onMessageUpdate: (content, image) => {
			const assistantMessage: Message = {
				id: Date.now().toString(),
				role: "assistant",
				content,
				...(image && { image }),
				timestamp: new Date(),
			};

			setChatMessages((prev) => {
				if (prev.length === 0 || prev[prev.length - 1].role !== "assistant") {
					return [...prev, assistantMessage];
				} else {
					const newMessages = [...prev];
					newMessages[newMessages.length - 1] = assistantMessage;
					return newMessages;
				}
			});
		},
	});

	// Message sending handler
	const handleSendMessage = () => {
		if (!inputValue.trim() && !uploadedImage && !uploadedPdf)
			return;

		const userMessage: Message = {
			id: Date.now().toString(),
			role: "user",
			content:
				inputValue.trim() ||
				(uploadedImage
					? "Image uploaded"
						: "PDF uploaded"),
			image: uploadedImage || undefined,
			pdf: uploadedPdf || undefined,
			timestamp: new Date(),
		};

		setChatMessages((prev) => [...prev, userMessage]);
		setLastMessage(
			inputValue.trim() ||
				(uploadedImage
					? "Describe this image"
						: "Analyze this document"),
		);

		// Reset inputs
		setInputValue("");
		setUploadedImage(null);
		setUploadedPdf(null);
	};

	return (
		<div className="flex bg-white text-black overflow-hidden">
			{/* Mobile Menu Button */}
			<button
				onClick={() => setSidebarOpen(!sidebarOpen)}
				className="fixed top-4 left-4 z-50 lg:hidden bg-gray-800 text-white p-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
				aria-label="Toggle sidebar"
			>
				<svg
					className="w-6 h-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					{sidebarOpen ? (
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					) : (
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 6h16M4 12h16M4 18h16"
						/>
					)}
				</svg>
			</button>

			{/* Overlay for mobile */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-30 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<div
				className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-80 lg:w-80
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
			>
				<Sidebar setChatMessages={setChatMessages} />
			</div>

			{/* Main Chat Area */}
			<div className="flex-1 flex flex-col h-screen w-full lg:w-auto">
				<ChatMessages messages={chatMessages} />

				<ChatInput
					inputValue={inputValue}
					onInputChange={setInputValue}
					onSend={handleSendMessage}
					uploadedImage={uploadedImage}
					uploadedPdf={uploadedPdf}
					onImageUpload={setUploadedImage}
					onPdfUpload={setUploadedPdf}
					onImageRemove={() => setUploadedImage(null)}
					onPdfRemove={() => setUploadedPdf(null)}
					currentlyStreaming={currentlyStreaming}
					currentlySending={currentlySending}
				/>
			</div>
		</div>
	);
}
