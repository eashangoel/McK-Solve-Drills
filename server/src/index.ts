import 'dotenv/config';
import { appReady } from './app.js';

const PORT = Number(process.env.PORT) || 3001;

const app = await appReady;

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
});
