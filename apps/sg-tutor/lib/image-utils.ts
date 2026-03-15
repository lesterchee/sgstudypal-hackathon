// Purpose: Client-Side Image Compression — resizes and compresses images below
// 1MB before uploading to Firebase Storage. Uses native HTML5 Canvas API for
// zero-dependency compression. Handles edge cases: 0-byte files, non-image MIME
// types, and images already under the size limit.

// Purpose: Maximum file size in bytes (1MB) after compression.
const MAX_FILE_SIZE = 1 * 1024 * 1024;

// Purpose: Maximum dimension (width or height) for the resized image.
// Maintains aspect ratio while capping the longest edge.
const MAX_DIMENSION = 1600;

// Purpose: JPEG quality steps — iteratively reduces quality to hit the size target.
const QUALITY_STEPS = [0.8, 0.6, 0.4, 0.2];

// Purpose: Result type returned by the compression utility.
export interface CompressionResult {
    /** Purpose: The compressed file (or original if already small enough). */
    file: File;
    /** Purpose: Whether compression was applied. */
    wasCompressed: boolean;
    /** Purpose: Original file size in bytes. */
    originalSize: number;
    /** Purpose: Final file size in bytes after compression. */
    finalSize: number;
}

// Purpose: Validate that the input is a supported image MIME type.
function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

// Purpose: Load an image file into an HTMLImageElement for Canvas drawing.
function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
        img.src = URL.createObjectURL(file);
    });
}

// Purpose: Calculate the resized dimensions while maintaining aspect ratio.
// Caps the longest edge at MAX_DIMENSION pixels.
function calculateDimensions(
    width: number,
    height: number
): { width: number; height: number } {
    if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        return { width, height };
    }

    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    return {
        width: Math.round(width * ratio),
        height: Math.round(height * ratio),
    };
}

// Purpose: Convert a canvas to a File object at a given JPEG quality level.
function canvasToFile(
    canvas: HTMLCanvasElement,
    quality: number,
    originalName: string
): Promise<File> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas toBlob returned null'));
                    return;
                }
                // Purpose: Rename the output file with a .jpg extension.
                const compressedName = originalName.replace(/\.[^.]+$/, '.jpg');
                resolve(new File([blob], compressedName, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            quality
        );
    });
}

// Purpose: Main entry point — compresses an image file below 1MB using
// progressive quality reduction. Returns the original file if it's already
// small enough or if the input is not an image.
export async function compressImageClientSide(
    file: File
): Promise<CompressionResult> {
    const originalSize = file.size;

    // Purpose: Edge case — reject 0-byte files.
    if (originalSize === 0) {
        throw new Error('Cannot compress a 0-byte file.');
    }

    // Purpose: Edge case — non-image MIME types pass through unchanged.
    if (!isImageFile(file)) {
        return { file, wasCompressed: false, originalSize, finalSize: originalSize };
    }

    // Purpose: Skip compression if already under the size limit.
    if (originalSize <= MAX_FILE_SIZE) {
        return { file, wasCompressed: false, originalSize, finalSize: originalSize };
    }

    // Purpose: Load the image and draw it onto a Canvas at reduced dimensions.
    const img = await loadImage(file);
    const { width, height } = calculateDimensions(img.naturalWidth, img.naturalHeight);

    // Purpose: Create an offscreen canvas for the resize operation.
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get Canvas 2D context.');
    }

    ctx.drawImage(img, 0, 0, width, height);

    // Purpose: Revoke the object URL to free memory.
    URL.revokeObjectURL(img.src);

    // Purpose: Iteratively reduce JPEG quality until file is under MAX_FILE_SIZE.
    for (const quality of QUALITY_STEPS) {
        const compressed = await canvasToFile(canvas, quality, file.name);
        if (compressed.size <= MAX_FILE_SIZE) {
            return {
                file: compressed,
                wasCompressed: true,
                originalSize,
                finalSize: compressed.size,
            };
        }
    }

    // Purpose: Fallback — return the lowest quality version even if still over 1MB.
    // This is better than failing entirely.
    const fallback = await canvasToFile(canvas, 0.1, file.name);
    return {
        file: fallback,
        wasCompressed: true,
        originalSize,
        finalSize: fallback.size,
    };
}
