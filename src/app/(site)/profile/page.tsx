import { redirect } from "next/navigation";
import {
  ProfileView,
  type ProfileCustomer,
} from "@/components/profile/profile-view";
import { resolveCustomerAvatar } from "@/lib/customer-avatar";
import { getCustomerLibraryStats } from "@/lib/customer-library-stats";
import { getCustomerSession } from "@/lib/customer-auth";
import { getPrisma } from "@/lib/prisma";

export const metadata = {
  title: "الملف الشخصي",
  description: "إدارة بيانات حسابك في منصة منتظر",
};

export default async function ProfilePage() {
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/profile")}`);
  }

  const prisma = getPrisma();
  if (!prisma) {
    const fallback: ProfileCustomer = {
      id: session.id,
      email: session.email,
      name: session.name,
      phone: null,
      country: null,
      region: null,
      city: null,
      countryCode: null,
      hasGoogle: false,
      avatarUrl: null,
      googleAvatarUrl: null,
      displayAvatarUrl: null,
      createdAt: new Date().toISOString(),
      stats: { courses: 0, booklets: 0 },
    };
    return <ProfileView customer={fallback} />;
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      country: true,
      region: true,
      city: true,
      countryCode: true,
      googleId: true,
      avatarUrl: true,
      googleAvatarUrl: true,
      createdAt: true,
    },
  });

  if (!customer) {
    redirect("/login");
  }

  const stats = await getCustomerLibraryStats(prisma, customer.id);

  return (
    <ProfileView
      customer={{
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        country: customer.country,
        region: customer.region,
        city: customer.city,
        countryCode: customer.countryCode,
        hasGoogle: Boolean(customer.googleId),
        avatarUrl: customer.avatarUrl,
        googleAvatarUrl: customer.googleAvatarUrl,
        displayAvatarUrl: resolveCustomerAvatar(customer),
        createdAt: customer.createdAt.toISOString(),
        stats,
      }}
    />
  );
}
