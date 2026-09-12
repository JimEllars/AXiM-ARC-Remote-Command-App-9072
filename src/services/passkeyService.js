const PASSPORT_URL = 'https://passport.axim.us.com';
const ALLOWED_EMAILS = [
  'james.ellars@axim.us.com',
  'jrellars@gmail.com'
];

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function encodeBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function serializeCredential(credential) {
  return {
    id: credential.id,
    rawId: encodeBase64Url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: encodeBase64Url(credential.response.authenticatorData),
      clientDataJSON: encodeBase64Url(credential.response.clientDataJSON),
      signature: encodeBase64Url(credential.response.signature),
      userHandle: credential.response.userHandle
        ? encodeBase64Url(credential.response.userHandle)
        : null
    },
    clientExtensionResults: credential.getClientExtensionResults()
  };
}

function prepareRequestOptions(options) {
  return {
    ...options,
    challenge: decodeBase64Url(options.challenge),
    allowCredentials: options.allowCredentials?.map((credential) => ({
      ...credential,
      id: decodeBase64Url(credential.id)
    })),
    userVerification: 'required'
  };
}

export function isPasskeySupported() {
  return Boolean(window.PublicKeyCredential && navigator.credentials);
}

export async function getPassportSession() {
  const response = await fetch('/api/remote/auth/session', {
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });

  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Passport session check failed.');

  const session = await response.json();
  const isAllowed = ALLOWED_EMAILS.includes(session.user?.email)
    && session.user?.role === 'super_user';

  if (!isAllowed) throw new Error('This Passport account is not authorized.');
  return session;
}

export async function authenticateWithPasskey(email) {
  if (!isPasskeySupported()) {
    throw new Error('Passkeys are not supported by this browser.');
  }

  if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
    throw new Error('This account is not authorized for ARC.');
  }

  const challengeResponse = await fetch('/api/remote/auth/challenge', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase() })
  });

  if (!challengeResponse.ok) {
    throw new Error('Unable to request a secure Passport challenge.');
  }

  const options = await challengeResponse.json();
  const credential = await navigator.credentials.get({
    publicKey: prepareRequestOptions(options)
  });

  const verifyResponse = await fetch('/api/remote/auth/verify', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.toLowerCase(),
      credential: serializeCredential(credential)
    })
  });

  if (!verifyResponse.ok) throw new Error('Biometric verification failed.');

  const session = await verifyResponse.json();
  if (
    !ALLOWED_EMAILS.includes(session.user?.email)
    || session.user?.role !== 'super_user'
  ) {
    throw new Error('Super-user authorization was not confirmed.');
  }

  return session;
}

export function openPassportSso() {
  const returnUrl = encodeURIComponent(window.location.href);
  window.location.assign(`${PASSPORT_URL}/login?return_url=${returnUrl}`);
}