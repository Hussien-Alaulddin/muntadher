/** يحدّد نوع قاعدة البيانات من رابط البيئة */
export function isSqliteDatabase(): boolean {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.MYSQL_DATABASE_URL,
    process.env.HOSTINGER_DATABASE_URL,
  ];
  for (const raw of candidates) {
    const url = raw?.trim();
    if (url?.startsWith("file:")) return true;
  }
  return false;
}
