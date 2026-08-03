export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // تحميل /home/u908955624/muntadhar.env قبل أي اتصال بقاعدة البيانات
    require("../scripts/load-persistent-env");
  }
}
