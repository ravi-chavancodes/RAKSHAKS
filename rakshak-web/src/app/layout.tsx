import type { Metadata } from "next";
import { Golos_Text, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/shell/navbar";
import { Footer } from "@/components/shell/footer";
import { copy } from "@/lib/copy";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const golosText = Golos_Text({
  variable: "--font-golos-text",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${copy.brand.name} — ${copy.brand.tagline}`,
  description: copy.brand.disclaimer,
  icons: {
    icon: "/images/rakshak-mark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${golosText.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-strong">
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16 sm:px-6">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
