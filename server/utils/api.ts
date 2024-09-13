export function requireParam(...params: any[]) {
    if (params.some(param => !param)) {
        throw 'invalid-params'
    }
}

export async function isAuthed(token: string) {
    await verifyToken(token)
}

export async function matchTokenPermission(token: string, matchingPermission: string) {
    await verifyToken(token);
    if (!await checkPermission(await getUsernameByToken(token), matchingPermission)) {
        throw 'permission-denied';
    }
}