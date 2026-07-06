import { PORT } from './config.js';
import { initDb } from './db.js';
import { app } from './app.js';

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`FormForge API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
