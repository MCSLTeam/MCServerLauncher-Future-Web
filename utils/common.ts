export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isClientRender() {
	return typeof window !== 'undefined';
}
