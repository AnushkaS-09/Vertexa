/**
 * Vertexa SSRF Protection & Official Government Domain Validator
 */

const dns = require('dns').promises;
const net = require('net');

// Allowed government and statutory domain patterns
const ALLOWED_DOMAIN_PATTERNS = [
  /\.gov\.in$/i,
  /\.nic\.in$/i,
  /\.maharashtra\.gov\.in$/i,
  /\.mcgm\.gov\.in$/i,
  /\.pmc\.gov\.in$/i,
  /\.pcmcindia\.gov\.in$/i,
  /\.cidco\.maharashtra\.gov\.in$/i,
  /\.aai\.aero$/i,
  /\.mahaonline\.gov\.in$/i,
  /\.mahadma\.maharashtra\.gov\.in$/i,
  /\.mahabhumi\.gov\.in$/i,
  /^portal\.mcgm\.gov\.in$/i,
  /^bhulekh\.mahabhumi\.gov\.in$/i,
  /^aaplesarkar\.mahaonline\.gov\.in$/i,
  /^mahadma\.maharashtra\.gov\.in$/i,
  /^mahafireservice\.gov\.in$/i,
  /^ecoclearance\.nic\.in$/i,
  /^nocas2\.aai\.aero$/i
];

function isPrivateIp(ip) {
  if (!ip) return true;

  // IPv4 Loopback
  if (ip === '127.0.0.1' || ip.startsWith('127.')) return true;
  // IPv4 Private (RFC 1918)
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  // Link-Local / AWS Metadata (169.254.x.x)
  if (ip.startsWith('169.254.')) return true;
  // Zero address
  if (ip === '0.0.0.0' || ip === '::' || ip === '::1') return true;

  // IPv6 Private / Link-local / Unique Local
  if (ip.toLowerCase().startsWith('fe80:') || ip.toLowerCase().startsWith('fc00:') || ip.toLowerCase().startsWith('fd00:')) {
    return true;
  }

  return false;
}

async function validateGovernmentUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isAllowed: false, reason: 'Missing or non-string URL parameter.' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { isAllowed: false, reason: 'Invalid URL format.' };
  }

  // 1. Protocol check
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { isAllowed: false, reason: 'Only HTTP and HTTPS protocols are permitted.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject explicit localhost / raw IP input
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || net.isIP(hostname)) {
    return { isAllowed: false, reason: 'Direct IP or localhost destinations are forbidden.' };
  }

  // 3. Domain allowlist check
  const isAllowedDomain = ALLOWED_DOMAIN_PATTERNS.some((pattern) => pattern.test(hostname));
  if (!isAllowedDomain) {
    return {
      isAllowed: false,
      reason: `Domain "${hostname}" is not in the permitted official government/municipal allowlist (*.gov.in, *.nic.in, etc.).`
    };
  }

  // 4. DNS resolution check against DNS rebinding & private subnet hijacking
  try {
    const lookupResult = await dns.lookup(hostname, { all: true });
    for (const record of lookupResult) {
      if (isPrivateIp(record.address)) {
        return { isAllowed: false, reason: 'Target domain resolves to a private or internal network address.' };
      }
    }
  } catch (err) {
    // DNS resolution failure
    return { isAllowed: false, reason: `Failed to resolve domain: ${err.message}` };
  }

  return {
    isAllowed: true,
    normalizedUrl: parsed.toString()
  };
}

module.exports = {
  validateGovernmentUrl,
  isPrivateIp,
  ALLOWED_DOMAIN_PATTERNS
};
