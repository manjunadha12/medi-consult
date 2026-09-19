import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, 'knowledgeBase.json');
const rawData = fs.readFileSync(jsonPath, 'utf-8');
const knowledgeBase = JSON.parse(rawData);

export default knowledgeBase;
export { knowledgeBase };
