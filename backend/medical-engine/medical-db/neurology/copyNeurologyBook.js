import fs from 'fs';
import path from 'path';

const srcPath = 'E:/clone app/backend/bradley-and-daroffs-neurology-in-clinical-practice-8nbsped_compress.pdf';
const destDir = path.join(path.resolve(), 'medical-db', 'neurology');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const destPath = path.join(destDir, 'bradley-and-daroffs-neurology-in-clinical-practice-8th-ed.pdf');

console.log('Copying Bradley & Daroff 8th Ed to:', destPath);
fs.copyFileSync(srcPath, destPath);

const stats = fs.statSync(destPath);
console.log('✅ Successfully placed in neurology repository. File size:', (stats.size / (1024 * 1024)).toFixed(2), 'MB');
