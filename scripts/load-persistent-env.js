/**
 * يحمّل متغيرات البيئة من ملف ثابت خارج مجلد نشر GitHub.
 * Hostinger أحياناً يعيد متغيرات اللوحة للقيم القديمة بعد كل Deploy.
 *
 * المسارات المجربة بالترتيب:
 * - HOSTINGER_ENV_FILE
 * - /home/u908955624/muntadhar.env
 * - ~/muntadhar.env
 */
const fs = require("fs");
const path = require("path");

const CANDIDATES = [
  process.env.HOSTINGER_ENV_FILE,
  "/home/u908955624/muntadhar.env",
  process.env.HOME ? path.join(process.env.HOME, "muntadhar.env") : null,
].filter(Boolean);

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseEnvFile(content) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    const value = stripQuotes(trimmed.slice(eq + 1).trim());
    // الملف الدائم هو المصدر الصحيح — يتجاوز قيم اللوحة القديمة
    process.env[key] = value;
  }
}

function loadPersistentEnv() {
  for (const file of CANDIDATES) {
    try {
      if (!fs.existsSync(file)) continue;
      parseEnvFile(fs.readFileSync(file, "utf8"));
      console.log("[load-persistent-env] تم التحميل من", file);
      return file;
    } catch (error) {
      console.warn(
        "[load-persistent-env] تعذّر قراءة",
        file,
        error instanceof Error ? error.message : error,
      );
    }
  }
  console.warn(
    "[load-persistent-env] لم يُعثر على muntadhar.env — أنشئه في /home/u908955624/muntadhar.env",
  );
  return null;
}

loadPersistentEnv();

module.exports = { loadPersistentEnv };
