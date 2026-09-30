import { lookup } from "dns/promises";
import { BlockList, isIP } from "net";

// Addresses the server must never fetch on behalf of a user (SSRF protection):
// loopback, private networks, link-local (incl. cloud metadata), CGNAT, multicast, reserved.
const blockedRanges = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blockedRanges.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blockedRanges.addSubnet(network, prefix, "ipv6");
}

export function isPublicAddress(address: string): boolean {
  // IPv4-mapped IPv6 (::ffff:127.0.0.1) must be checked as IPv4
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return isPublicAddress(mapped[1]);

  const family = isIP(address);
  if (family === 0) return false;
  return !blockedRanges.check(address, family === 4 ? "ipv4" : "ipv6");
}

/** True when the URL is http(s) and every address its host resolves to is public. */
export async function isSafePublicUrl(url: URL): Promise<boolean> {
  if (!["http:", "https:"].includes(url.protocol)) return false;

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) return isPublicAddress(host);

  try {
    const addresses = await lookup(host, { all: true });
    return addresses.length > 0 && addresses.every((a) => isPublicAddress(a.address));
  } catch {
    return false;
  }
}
