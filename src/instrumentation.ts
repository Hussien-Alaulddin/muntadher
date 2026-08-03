export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    require("../scripts/load-persistent-env");

    const dbUrl =
      process.env.DATABASE_URL?.trim() ||
      process.env.MYSQL_DATABASE_URL?.trim() ||
      process.env.HOSTINGER_DATABASE_URL?.trim();

    if (dbUrl?.startsWith("file:")) {
      process.env.DATABASE_URL = dbUrl;
      console.log("[instrumentation] DATABASE_URL ← SQLite محلي");
    } else if (dbUrl?.startsWith("mysql://")) {
      process.env.DATABASE_URL = dbUrl;
      console.log(
        "[instrumentation] DATABASE_URL ← MySQL",
        dbUrl.replace(/:[^:@/]+@/, ":****@"),
      );
    }
  }
}
