export type CourseRequestStatus = "pending" | "approved" | "rejected";

export function isCourseRequestStatus(
  value: string,
): value is CourseRequestStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

export function courseRequestStatusLabel(status: string) {
  switch (status) {
    case "approved":
      return "مقبول";
    case "rejected":
      return "مرفوض";
    case "pending":
    default:
      return "قيد المعالجة";
  }
}

export function courseRequestStatusHint(status: string) {
  switch (status) {
    case "approved":
      return "تم قبول طلبك — يمكنك بدء مشاهدة الدورة الآن";
    case "rejected":
      return "تم رفض الطلب. يمكنك تقديم طلب شراء جديد إن رغبت";
    case "pending":
    default:
      return "طلبك قيد المراجعة وسنفتح الدورة لك بعد القبول";
  }
}
