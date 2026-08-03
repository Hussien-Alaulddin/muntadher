export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    require("../scripts/load-persistent-env");

    const mysql =
      process.env.MYSQL_DATABASE_URL?.trim() ||
      process.env.HOSTINGER_DATABASE_URL?.trim() ||
      process.env.DATABASE_URL?.trim();

    if (mysql?.startsWith("mysql://")) {
      process.env.DATABASE_URL = mysql;
      console.log(
        "[instrumentation] DATABASE_URL ← MySQL",
        mysql.replace(/:[^:@/]+@/, ":****@"),
      );
    }
  }
}
