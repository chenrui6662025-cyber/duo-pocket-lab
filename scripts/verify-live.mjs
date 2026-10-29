// Read-only public endpoint checks. curl honors the environment's HTTPS proxy/CA.
// No access token is read or required.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const repo = 'chenrui6662025-cyber/duo-pocket-lab';
const expectedBase = 'https://chenrui6662025-cyber.github.io/duo-pocket-lab/';
async function get(url, github = false) {
  const args = ['--silent', '--show-error', '--location', '--fail-with-body', '--max-time', '20'];
  if (github) args.push('-H', 'Accept: application/vnd.github+json', '-H', 'X-GitHub-Api-Version: 2022-11-28');
  args.push(String(url));
  try { return (await run('curl', args, { maxBuffer: 5 * 1024 * 1024 })).stdout; }
  catch (error) { throw new Error(`${url} → ${error.stderr?.trim() || error.message}`); }
}
try {
  const metadata = JSON.parse(await get(`https://api.github.com/repos/${repo}`, true));
  if (metadata.private || metadata.default_branch !== 'main') throw new Error('Expected a Public repository with main as the default branch.');
  const pages = JSON.parse(await get(`https://api.github.com/repos/${repo}/pages`, true));
  if (pages.build_type !== 'workflow' || pages.html_url !== expectedBase) throw new Error('Pages is not configured for the expected Actions deployment.');
  const runs = JSON.parse(await get(`https://api.github.com/repos/${repo}/actions/workflows/deploy.yml/runs?branch=main&per_page=1`, true));
  const run = runs.workflow_runs?.[0];
  if (!run || run.status !== 'completed' || run.conclusion !== 'success') throw new Error('The latest Pages workflow has not completed successfully.');
  const html = await get(expectedBase);
  if (!html.includes('Duo Pocket Lab') || !html.includes('manifest.webmanifest')) throw new Error('The live response is not the expected PWA.');
  const manifest = JSON.parse(await get(new URL('manifest.webmanifest', expectedBase)));
  if (manifest.display !== 'standalone' || manifest.scope !== './' || manifest.start_url !== './') throw new Error('Manifest is not scoped to the Pages project path.');
  for (const path of ['sw.js', 'src/app.js', 'src/model.js', 'src/styles.css', 'icons/icon.svg', 'icons/apple-touch-icon.png', ...manifest.icons.map(icon => icon.src)]) {
    await get(new URL(path, expectedBase));
  }
  console.log(`Public repository, successful workflow, HTTPS page, manifest and offline assets verified: ${expectedBase}`);
  console.log(`Workflow: ${run.html_url}`);
  console.log('Finish with a real iPhone home-screen installation and offline reload check.');
} catch (error) {
  console.error(`Deployment NOT verified: ${error.message}`);
  process.exitCode = 1;
}
