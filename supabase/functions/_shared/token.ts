// Signierte Kennung für persönliche Links (Stornierung): <Kennung>.<Signatur>, beides base64url.
// Die Signatur (HMAC-SHA256 mit einem geheimen Schlüssel) verhindert, dass Kennungen erfunden werden.

const encoder = new TextEncoder()

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return toBase64Url(
    new Uint8Array(
      await crypto.subtle.sign('HMAC', key, encoder.encode(value)),
    ),
  )
}

export async function signToken(id: string, secret: string): Promise<string> {
  return `${id}.${await sign(id, secret)}`
}

/** Liefert die Kennung, wenn die Signatur stimmt, sonst null. */
export async function verifyToken(
  token: string,
  secret: string,
): Promise<string | null> {
  const index = token.lastIndexOf('.')
  if (index <= 0) return null
  const id = token.slice(0, index)
  const given = token.slice(index + 1)
  const expected = await sign(id, secret)
  if (given.length !== expected.length) return null
  let diff = 0
  for (let i = 0; i < expected.length; i += 1)
    diff |= given.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0 ? id : null
}
