/**
 * File upload handlers
 */

import type { AudioData, ImageData, PdfData } from "@/types/chat";

export const handleImageUpload = (
	file: File,
	onSuccess: (image: ImageData) => void,
	onError: (message: string) => void,
): void => {
	// Check if it's an image
	if (!file.type.startsWith("image/")) {
		onError("Please upload an image file");
		return;
	}

	// Check file size (limit to 10MB)
	if (file.size > 10 * 1024 * 1024) {
		onError("Image size should be less than 10MB");
		return;
	}

	const reader = new FileReader();
	reader.onload = (e) => {
		const result = e.target?.result as string;
		const base64Data = result.split(",")[1];
		const format = file.type.split("/")[1];

		onSuccess({
			data: base64Data,
			format: format,
			url: result,
		});
	};
	reader.readAsDataURL(file);
};

export const handlePdfUpload = (
	file: File,
	onSuccess: (pdf: PdfData) => void,
	onError: (message: string) => void,
): void => {
	// Check if it's a PDF file
	if (file.type !== "application/pdf") {
		onError("Please upload a PDF file");
		return;
	}

	// Check file size (limit to 50MB for PDFs)
	if (file.size > 50 * 1024 * 1024) {
		onError("PDF file size should be less than 50MB");
		return;
	}

	const reader = new FileReader();
	reader.onload = (e) => {
		const result = e.target?.result as string;
		const base64Data = result.split(",").splice(1).join(",");

		onSuccess({
			data: base64Data,
			filename: file.name,
			url: result,
		});
	};
	reader.readAsDataURL(file);
};
