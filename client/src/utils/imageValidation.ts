// One image-upload policy shared by every form.
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImage(file: File): string | null {
	if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Only JPG, PNG and WebP images are allowed.';
	if (file.size === 0) return 'The image file is empty.';
	if (file.size > MAX_IMAGE_SIZE) return 'Each image must be 5 MB or smaller.';
	return null;
}
