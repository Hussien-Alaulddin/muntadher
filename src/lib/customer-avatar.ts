/**
 * صورة البروفايل المعروضة: المخصصة أولاً، ثم صورة Google، وإلا null.
 */
export function resolveCustomerAvatar(customer: {
  avatarUrl?: string | null;
  googleAvatarUrl?: string | null;
}) {
  const custom = customer.avatarUrl?.trim();
  if (custom) return custom;
  const google = customer.googleAvatarUrl?.trim();
  if (google) return google;
  return null;
}
