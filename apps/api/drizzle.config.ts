import { config } from "dotenv-mono";
import { type Config, defineConfig } from "drizzle-kit";

config();

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://zeroqc_user:zeroqc_password@localhost:5432/zeroqc",
  },
}) satisfies Config;
