import { getStringWidth, getCharacterWidth } from "./string-utils";
import {
	getAvailableWidth,
	getAvailableWidthWhenSharing,
	getElementProperties,
} from "./element-utils";

type ElementOptions = {
	boundingElement?: HTMLElement;
	targetElement: HTMLElement;
	originalText: string;
};

type EllipsisOptions = {
	ellipsisSymbol: string;
	lineLimit: number;
};

type TruncateTextArgs = ElementOptions & EllipsisOptions;

const truncateText = ({
	boundingElement,
	targetElement,
	originalText,
	ellipsisSymbol,
	lineLimit,
}: TruncateTextArgs) => {
	const { fontSize, fontFamily } = getElementProperties(targetElement);
	let availableWidth = boundingElement
		? getAvailableWidthWhenSharing(targetElement, boundingElement)
		: getAvailableWidth(targetElement);

	if (lineLimit > 1) availableWidth *= lineLimit - 0.3;

	const maxTextWidth = getStringWidth(originalText, fontSize, fontFamily);

	/*
		If maximum possible originalText width is less than or equal to available width, 
		then there is no need to truncate originalText.
		Return original originalText.
	*/
	if (maxTextWidth <= availableWidth) return originalText;

	const middleEllipsisWidth = getStringWidth(
		ellipsisSymbol,
		fontSize,
		fontFamily,
	);
	const textCharCount = originalText.length;

	let remainingWidth = availableWidth - middleEllipsisWidth;
	let firstHalf = "";
	let secondHalf = "";

	for (let i = 0; i < Math.floor(textCharCount / 2); i++) {
		remainingWidth -= getCharacterWidth(originalText[i], fontFamily, fontSize);

		if (remainingWidth < 0) break;
		firstHalf += originalText[i];

		remainingWidth -= getCharacterWidth(
			originalText[textCharCount - i - 1],
			fontFamily,
			fontSize,
		);

		if (remainingWidth < 0) break;
		secondHalf = originalText[textCharCount - i - 1] + secondHalf;
	}

	return firstHalf + ellipsisSymbol + secondHalf;
};

type TruncateOnResizeArgs = ElementOptions & Partial<EllipsisOptions>;

export const truncateOnResize = ({
	boundingElement,
	targetElement,
	originalText,
	ellipsisSymbol = "...",
	lineLimit = 1,
}: TruncateOnResizeArgs) => {
	if (!targetElement.offsetParent || !originalText) return () => {};

	const observer = new ResizeObserver(() => {
		const truncatedText = truncateText({
			boundingElement,
			targetElement,
			originalText,
			ellipsisSymbol,
			lineLimit,
		});

		// Directly update the originalText in the DOM
		targetElement.textContent = truncatedText;
	});

	observer.observe(targetElement.offsetParent);

	return () => observer.disconnect();
};
