import path from 'node:path';
import type { Options as ExecaOptions, ExecaReturnValue } from 'execa';
import { execa } from 'execa';
import colors from 'picocolors';
import minimist from 'minimist';

export const args = minimist(process.argv.slice(2));

export const isDryRun = !!args.dry;

export async function run(
  bin: string,
  args: string[],
  opts: ExecaOptions<string> = {},
): Promise<ExecaReturnValue<string>> {
  return execa(bin, args, { stdio: 'inherit', ...opts });
}

export function dryRun(
  bin: string,
  args: string[],
  opts?: ExecaOptions<string>,
): Promise<void> {
  console.log(colors.blue(`[dryrun] ${bin} ${args.join(' ')}`), opts || '');
  return Promise.resolve();
}

export const runIfNotDry = isDryRun ? dryRun : run;

export function step(msg: string): void {
  return console.log(colors.cyan(msg));
}
interface Pkg {
  name: string;
  version: string;
  private?: boolean;
}

export function getPackageInfo(): {
  pkg: Pkg;
  pkgName: string;
  pkgDir: string;
  pkgPath: string;
  currentVersion: string;
} {
  const pkgDir = path.resolve(__dirname, '../');
  const pkgPath = path.resolve(__dirname, '../package.json');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pkg: Pkg = require(pkgPath);
  const pkgName = pkg.name;
  const currentVersion = pkg.version;

  if (pkg.private) {
    throw new Error(`Package ${pkgName} is private`);
  }

  return {
    pkg,
    pkgName,
    pkgDir,
    pkgPath,
    currentVersion,
  };
}

export async function publishPackage(
  pkdDir: string,
  tag?: string,
): Promise<void> {
  const publicArgs = ['publish', '--access', 'public'];
  if (tag) {
    publicArgs.push(`--tag`, tag);
  }

  await runIfNotDry('npm', publicArgs, {
    cwd: pkdDir,
  });
}
