import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This is a dummy placeholder for generating certs.
// In a real env, you'd use openssl.
// I'll suggest the user runs the openssl command in the terminal.

console.log("====================================================");
console.log("HTTPS CONSOLE LOG");
console.log("To enable HTTPS on your local machine, run this command in your BACKEND folder:");
console.log("openssl req -nodes -new -x509 -keyout key.pem -out cert.pem");
console.log("====================================================");
