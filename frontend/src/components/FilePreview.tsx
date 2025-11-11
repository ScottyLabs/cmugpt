/**
 * File upload preview components
 */

import type { ImageData, PdfData } from "@/types/chat";

interface ImagePreviewProps {
	image: ImageData;
	onRemove: () => void;
}

export const ImagePreview = ({ image, onRemove }: ImagePreviewProps) => {
	return (
		<div className="mb-3 sm:mb-4 relative inline-block">
			<img
				src={image.url}
				alt="Upload preview"
				className="max-h-24 sm:max-h-32 rounded-lg border border-black/20"
			/>
			<button
				onClick={onRemove}
				className="absolute -top-2 -right-2 text-black rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-sm sm:text-base"
				style={{ backgroundColor: "hsla(0, 0%, 96%, 1)" }}
			>
				×
			</button>
		</div>
	);
};

interface PdfPreviewProps {
	pdf: PdfData;
	onRemove: () => void;
}

export const PdfPreview = ({ pdf, onRemove }: PdfPreviewProps) => {
	return (
		<div className="mb-3 sm:mb-4 relative inline-block max-w-full">
			<div className="bg-white/10 border border-black/20 rounded-lg p-2 sm:p-3">
				<div className="flex items-center gap-2 mb-2">
					<span className="text-xs sm:text-sm text-black/70 truncate">
						📄 PDF file: {pdf.filename}
					</span>
					<button
						onClick={onRemove}
						className="text-black rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0"
						style={{ backgroundColor: "hsla(0, 0%, 96%, 1)" }}
					>
						×
					</button>
				</div>
				<div className="flex gap-2">
					<a
						href={pdf.url}
						download={pdf.filename}
						className="px-2 sm:px-3 py-1 text-black text-xs sm:text-sm rounded transition-colors"
						style={{ backgroundColor: "hsla(0, 0%, 96%, 1)" }}
					>
						Download
					</a>
					<a
						href={pdf.url}
						target="_blank"
						rel="noopener noreferrer"
						className="px-2 sm:px-3 py-1 text-black text-xs sm:text-sm rounded transition-colors"
						style={{ backgroundColor: "hsla(0, 0%, 96%, 1)" }}
					>
						Open
					</a>
				</div>
			</div>
		</div>
	);
};
