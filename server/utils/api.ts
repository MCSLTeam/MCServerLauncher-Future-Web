export function requireParam(...params: any[]) {
	if (params.some((param) => !param)) {
		throw 'invalid-params';
	}
}

export async function isAuthed(token: string) {
	await verifyToken(token);
}

export async function matchTokenPermission(
	token: string,
	matchingPermission: string,
) {
	if (
		!(await hasPermission(
			await getUsernameByToken(token),
			matchingPermission,
		))
	) {
		throw 'permission-denied';
	}
}

export async function hasTokenPermission(
	token: string,
	matchingPermission: string,
) {
	return hasPermission(await getUsernameByToken(token), matchingPermission);
}

export async function requireEula() {
	if (!(await getConfig()).agreedEula) {
		throw 'eula-not-agreed';
	}
}
