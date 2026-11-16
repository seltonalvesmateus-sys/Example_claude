import { createApiServer } from './app.ts';
import { extractFromUrl } from './extractFromUrl.ts';

const PORT = Number(process.env.PORT) || 3001;
// Só aceita conexões da própria máquina; o Vite encaminha /api para cá em desenvolvimento.
const HOST = process.env.HOST || '127.0.0.1';

createApiServer((url) => extractFromUrl(url)).listen(PORT, HOST, () => {
  console.log(`API de extração rodando em http://${HOST}:${PORT}`);
});
