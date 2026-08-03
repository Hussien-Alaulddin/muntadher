/**
 * يحمّل متغيرات البيئة من ملف ثابت خارج مجلد نشر GitHub.
 * Hostinger أحياناً يعيد متغيرات اللوحة للقيم القديمة بعد كل Deploy.
 */
const fs = require("fs");
const path = require("path");

function candidates() {
  const home = process.env.HOME || "/home/u908955624";
  const domainRoot = path.join(home, "domains", "muntadhar.studio");
  const list = [
    process.env.HOSTINGER_ENV_FILE,
    path.join(domainRoot, "muntadhar.env"),
    path.join(domainRoot, "public_html", "muntadhar.env"),
    path.join(domainRoot, "private", "muntadhar.env"),
    path.join(home, "muntadhar.env"),
    path.join(home, "media", "..", "muntadhar.env"),
    // من داخل .builds/source/repository اصعد إلى جذر الدومين
    path.resolve(process.cwd(), "../../../muntadhar.env"),
    path.resolve(process.cwd(), "../../muntadhar.env"),
    path.resolve(process.cwd(), "../muntadhar.env"),
    path.resolve(process.cwd(), "muntadhar.env"),
  ];
  return [...new Set(list.filter(Boolean).map((p) => path.resolve(p)))];
}

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
    process.env[key] = value;
  }
}

function loadPersistentEnv() {
  for (const file of candidates()) {
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
    "[load-persistent-env] لم يُعثر على muntadhar.env — المسار المفضّل:",
    path.join(
      process.env.HOME || "/home/u908955624",
      "domains",
      "muntadhar.studio",
      "muntadhar.env",
    ),
  );
  return null;
}

loadPersistentEnv();

module.exports = { loadPersistentEnv };
