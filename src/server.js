import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';

async function start() {
  const port = Number(process.env.PORT);

  await connectDatabase();
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

start();
