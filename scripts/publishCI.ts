import { args, getPackageInfo, publishPackage, step } from './releaseUtils';

async function main() {
  const tag = args._[0];

  if (!tag) {
    throw new Error('No tag specified');
  }
  let version = tag;

  if (version.startsWith('v')) version = version.slice(1);

  const { currentVersion, pkgDir } = getPackageInfo();

  if (currentVersion !== version)
    throw new Error(
      `Package version from tag "${version}" mismatches with current version "${currentVersion}"`,
    );

  step('Publishing package...');
  const releaseTag = version.includes('beta')
    ? 'beta'
    : version.includes('alpha')
    ? 'alpha'
    : undefined;
  await publishPackage(pkgDir, releaseTag);
}

main().catch((err) => {
  console.error(err);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
