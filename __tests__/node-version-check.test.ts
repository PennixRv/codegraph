/**
 * Runtime admission follows the actual SQLite floor, without a future-major ban.
 */

import { describe, it, expect } from 'vitest';
import { buildNodeTooOldBanner, MIN_NODE_MAJOR, MIN_NODE_MINOR, isSupportedNodeVersion } from '../src/bin/node-version-check';

describe('isSupportedNodeVersion', () => {
  it('admits current and future runtimes above the SQLite floor', () => {
    for (const version of ['22.5.0', '22.10.0', '24.0.0', '25.9.0', '26.13.1', '30.0.0'])
      expect(isSupportedNodeVersion(version), version).toBe(true);
  });
  it('rejects runtimes without the required SQLite API and malformed identities', () => {
    for (const version of ['18.20.0', '20.19.0', '22.4.9', 'unknown', '25.invalid'])
      expect(isSupportedNodeVersion(version), version).toBe(false);
  });
});

describe('buildNodeTooOldBanner', () => {
  it('embeds the reported Node version in the header', () => {
    expect(buildNodeTooOldBanner('18.20.0')).toContain(
      'Unsupported Node.js version: 18.20.0'
    );
  });

  it('states the supported floor matching MIN_NODE_MAJOR', () => {
    expect(MIN_NODE_MAJOR).toBe(22);
    expect(MIN_NODE_MINOR).toBe(5);
    expect(buildNodeTooOldBanner('18.0.0')).toContain(
      `requires Node.js ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR} or newer for node:sqlite`
    );
  });

  it('points users to Node 22 LTS via nvm and Homebrew', () => {
    const banner = buildNodeTooOldBanner('16.0.0');
    expect(banner).toContain('Node.js 22 LTS');
    expect(banner).toContain('nvm install 22');
    expect(banner).toContain('brew install node@22');
  });

  it('documents the CODEGRAPH_ALLOW_UNSAFE_NODE override', () => {
    expect(buildNodeTooOldBanner('18.0.0')).toContain('CODEGRAPH_ALLOW_UNSAFE_NODE=1');
  });
});
