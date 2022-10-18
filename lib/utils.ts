import { getPackageInfoSync } from 'local-pkg';

/** copy from karma/lib/middleware/strip_host.js */
export default function stripHost(url: string) {
  return url.replace(/^https?:\/\/[a-z.:\d-]+\//, '/');
}

export const queryRE = /\?.*$/s;
export const hashRE = /#.*$/s;

export const cleanUrl = (url: string): string =>
  url.replace(hashRE, '').replace(queryRE, '');

export const getViteVersion = (root: string) =>
  getPackageInfoSync('vite', { paths: [root] })?.version || '3';
