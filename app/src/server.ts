import { app } from "./app";
import { env } from "./config/env.config";

console.log(`Server running on port ${env.PORT.toString()}`);
console.log(`Environment: ${env.NODE_ENV}`);

app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT.toString()}`);
});
