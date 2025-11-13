import { DocsLayout, type DocsLayoutProps } from "fumadocs-ui/layouts/docs";
import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
import { Banner } from "@/components/banner";
import { source } from "@/lib/source";

export const metadata: Metadata = {
  title: {
    template: "%s",
    default: "zeroqc",
  },
  description:
    "Complete documentation for zeroqc - the open source project management platform. Learn how to deploy, configure, and use zeroqc for your team.",
  keywords: [
    "zeroqc documentation",
    "project management docs",
    "self-hosted setup",
    "docker deployment",
    "kubernetes deployment",
    "nginx configuration",
    "traefik setup",
    "postgresql setup",
    "api documentation",
    "installation guide",
  ],
  openGraph: {
    title: "zeroqc Documentation",
    description:
      "Complete documentation for zeroqc - the open source project management platform. Learn how to deploy, configure, and use zeroqc for your team.",
    type: "website",
    url: "https://zeroqc.app/docs",
    siteName: "zeroqc",
    images: [
      {
        url: "/og-docs.png",
        width: 1200,
        height: 630,
        alt: "zeroqc Documentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "zeroqc Documentation",
    description:
      "Complete documentation for zeroqc - the open source project management platform. Learn how to deploy, configure, and use zeroqc for your team.",
    images: ["/og-docs.png"],
  },
  alternates: {
    canonical: "https://zeroqc.app/docs",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const docsOptions: DocsLayoutProps = {
  ...baseOptions,
  tree: source.pageTree,
  githubUrl: "https://github.com/usezeroqc/zeroqc",
  nav: {
    ...baseOptions.nav,
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Banner
        id="version-banner"
        variant="normal"
        className="border-b border-border/40 bg-muted/50 backdrop-blur-sm"
      >
        <div className="flex items-center justify-center gap-2">
          🎉
          <p className="text-muted-foreground">
            Version 2 of zeroqc is now available! Check out the{" "}
            <a
              href="https://github.com/usezeroqc/zeroqc/releases/tag/v2.0.0"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              changelog
            </a>
            .
          </p>
        </div>
      </Banner>
      <DocsLayout
        {...docsOptions}
        containerProps={{ className: "bg-background" }}
        sidebar={{ className: "bg-sidebar" }}
      >
        <Script
          defer
          data-domain="zeroqc.app"
          src="https://plausible.zeroqc.app/js/script.js"
        />
        {children}
      </DocsLayout>
    </>
  );
}
