import type { Metadata } from "next";
import { PT_Serif, Manrope } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { OrderListProvider } from "@/components/OrderListProvider";
import { getGroups } from "@/lib/categories";
import { getCurrentUser } from "@/lib/auth";

const displayFont = PT_Serif({
  variable: "--font-fraunces",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "ПО «Рускисть» — щёточные изделия собственного производства",
  description:
    "Производство и продажа щёток, кистей и щёточных изделий. Более 200 наименований, опт и розница, собственное производство.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [groups, user] = await Promise.all([getGroups(), getCurrentUser()]);

  return (
    <html
      lang="ru"
      className={`${displayFont.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <OrderListProvider>
          <SiteHeader groups={groups} user={user ? { name: user.name } : null} />
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
        </OrderListProvider>
      </body>
    </html>
  );
}
