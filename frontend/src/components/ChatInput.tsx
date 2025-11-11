/**
 * Chat input area with file upload buttons
 */

import {
	Camera01,
	FileAttachment04,
} from "@untitledui/icons";
import { useRef } from "react";
import type { ImageData, Model, PdfData } from "@/types/chat";
import {
	handleImageUpload,
	handlePdfUpload,
} from "@/utils/fileHandlers";
import { ImagePreview, PdfPreview } from "./FilePreview";
import { Spinner } from "./Spinner";

interface ChatInputProps {
	inputValue: string;
	onInputChange: (value: string) => void;
	onSend: () => void;
	uploadedImage: ImageData | null;
	uploadedPdf: PdfData | null;
	onImageUpload: (image: ImageData) => void;
	onPdfUpload: (pdf: PdfData) => void;
	onImageRemove: () => void;
	onPdfRemove: () => void;
	currentlyStreaming: boolean;
	currentlySending: boolean;
}

export const ChatInput = ({
	inputValue,
	onInputChange,
	onSend,
	uploadedImage,
	uploadedPdf,
	onImageUpload,
	onPdfUpload,
	onImageRemove,
	onPdfRemove,
	currentlyStreaming,
	currentlySending,
}: ChatInputProps) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onSend();
		}
	};

	return (
		<div className="p-3 sm:p-4 md:p-6 border-t border-black/20">
			{/* File Previews */}
			{uploadedImage && (
				<ImagePreview image={uploadedImage} onRemove={onImageRemove} />
			)}
			{uploadedPdf && <PdfPreview pdf={uploadedPdf} onRemove={onPdfRemove} />}

			{/* Hidden file inputs */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*,.pdf"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file && file.type.startsWith("image/")) {
						handleImageUpload(file, onImageUpload, alert);
					}
					else if (file && file.type === "application/pdf") {
						handlePdfUpload(file, onPdfUpload, alert);
					}
				}}
				className="hidden"
			/>

			{/* Input area */}
			<div className="flex gap-1 sm:gap-2">
				<input
					type="text"
					value={inputValue}
					onChange={(e) => onInputChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Type your message..."
					className="flex-1 p-2 sm:p-3 rounded-lg bg-white/10 border border-black/20 text-black placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
					disabled={currentlyStreaming}
				/>

				{/* PDF upload button */}
				<button
					onClick={() => fileInputRef.current?.click()}
					disabled={currentlyStreaming}
					className="px-2 sm:px-4 py-2 sm:py-3 disabled:bg-gray-300 bg-gray-600 disabled:cursor-not-allowed text-black rounded-lg font-medium transition-colors"
					title="Upload PDF"
				>
					<FileAttachment04 className="text-white w-5 h-5 sm:w-6 sm:h-6" />
				</button>

				{/* Send button */}
				<button
					onClick={onSend}
					disabled={
						(!inputValue.trim() &&
							!uploadedImage &&
							!uploadedPdf) ||
						currentlyStreaming
					}
					className="px-3 sm:px-6 py-2 sm:py-3 disabled:bg-gray-300 bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
				>
					{currentlyStreaming ? (
						currentlySending ? (
							"Sending..."
						) : (
							<Spinner />
						)
					) : (
						"Send"
					)}
				</button>
			</div>

			{/* Help text */}
			<div className="text-xs text-black/50 mt-2 hidden sm:block">
				<span>Press Enter to send</span>
					<span>
						{" "}
						• Upload images with{" "}
						<Camera01 className="inline-block align-middle ml-1" /> button
						{" "}
						• Upload PDFs with{" "}
						<FileAttachment04 className="inline-block align-middle ml-1" />{" "}
						button • Ask for image generation
					</span>
			</div>
		</div>
	);
};
