import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const mobileDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectDir = resolve(mobileDir, '..');
const envPath = resolve(projectDir, '.env');
const outputPath = resolve(mobileDir, 'src/env.generated.ts');

let apiKey = '';
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*NEXT_PUBLIC_STREAMOVIE_API_KEY\s*=\s*(.*?)\s*$/);
  if (!match) continue;

  apiKey = match[1];
  if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
    apiKey = apiKey.slice(1, -1);
  } else {
    apiKey = apiKey.replace(/\s+#.*$/, '').trim();
  }
  break;
}

if (!apiKey || apiKey === 'your_api_key_here') {
  throw new Error('NEXT_PUBLIC_STREAMOVIE_API_KEY is missing from the project .env file.');
}

mkdirSync(dirname(outputPath), {recursive: true});
writeFileSync(outputPath, `// Generated from the project .env file. Do not commit.\nexport const STREAMOVIE_API_KEY = ${JSON.stringify(apiKey)};\n`);
console.log('Loaded Streamovie catalog key from the project .env file.');
