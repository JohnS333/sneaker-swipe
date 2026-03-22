import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CartProvider } from "@/components/cart-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swipe Buy",
  description: "Next App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <CartProvider>
          <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarTrigger
              className="fixed top-4 z-30 size-14 transition-[left] duration-200 ease-linear left-8 md:left-4 md:peer-data-[state=expanded]:left-[calc(var(--sidebar-width)-1rem)] [&>svg]:size-8"
            />
            {children}
          </SidebarProvider>
        </CartProvider>
      </body>
    </html>
  );
}
