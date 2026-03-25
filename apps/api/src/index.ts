import { createServer } from "./server.js";
import { env } from "./config/env.js";

const app = createServer();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${env.PORT}`);
});

