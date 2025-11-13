import Script from "next/script";

interface StructuredDataProps {
  type?: "organization" | "software" | "article" | "faq";
  data?: {
    title?: string;
    description?: string;
    url?: string;
    datePublished?: string;
    dateModified?: string;
    questions?: Array<{
      question: string;
      answer: string;
    }>;
  };
}

export default function StructuredData({
  type = "organization",
  data,
}: StructuredDataProps) {
  const getStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
    };

    switch (type) {
      case "organization":
        return {
          ...baseData,
          "@type": "Organization",
          name: "zeroqc",
          url: "https://zeroqc.app",
          logo: "https://zeroqc.app/logo.png",
          description:
            "All you need. Nothing you don't. Open source project management that works for you, not against you.",
          foundingDate: "2024",
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            url: "https://github.com/usezeroqc/zeroqc/issues",
          },
          sameAs: [
            "https://github.com/usezeroqc/zeroqc",
            "https://twitter.com/usezeroqc",
            "https://discord.gg/rU4tSyhXXU",
          ],
        };

      case "software":
        return {
          ...baseData,
          "@type": "SoftwareApplication",
          name: "zeroqc",
          description:
            "Open source project management that works for you, not against you. Self-hosted, simple, and powerful.",
          url: "https://zeroqc.app",
          downloadUrl: "https://github.com/usezeroqc/zeroqc",
          screenshot: "https://zeroqc.app/screenshot.png",
          applicationCategory: "ProjectManagementApplication",
          operatingSystem: "Linux, macOS, Windows",
          softwareVersion: "latest",
          license: "https://opensource.org/licenses/MIT",
          author: {
            "@type": "Organization",
            name: "zeroqc",
            url: "https://zeroqc.app",
          },
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            description: "Free forever. All you need. Nothing you don't.",
          },
          features: [
            "Kanban boards",
            "Gantt charts",
            "Time tracking",
            "Team collaboration",
            "Issue tracking",
            "Project planning",
            "Self-hosted",
            "Docker deployment",
          ],
        };

      case "article":
        return {
          ...baseData,
          "@type": "Article",
          headline: data?.title || "zeroqc ⎯ All you need. Nothing you don't.",
          description:
            data?.description ||
            "Open source project management that works for you, not against you.",
          author: {
            "@type": "Organization",
            name: "zeroqc",
          },
          publisher: {
            "@type": "Organization",
            name: "zeroqc",
            logo: {
              "@type": "ImageObject",
              url: "https://zeroqc.app/logo.png",
            },
          },
          datePublished: data?.datePublished || new Date().toISOString(),
          dateModified: data?.dateModified || new Date().toISOString(),
          mainEntityOfPage: data?.url || "https://zeroqc.app",
        };

      case "faq":
        return {
          ...baseData,
          "@type": "FAQPage",
          mainEntity: data?.questions || [
            {
              "@type": "Question",
              name: "Is zeroqc really free?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, zeroqc is completely free and open source under the MIT license. There are no user limits or hidden costs.",
              },
            },
            {
              "@type": "Question",
              name: "How does zeroqc compare to Jira?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "zeroqc is an open source alternative to Jira with powerful features like issue tracking, kanban boards, and team collaboration, without the complexity or licensing costs.",
              },
            },
            {
              "@type": "Question",
              name: "Can I self-host zeroqc?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, zeroqc is designed for self-hosting. You can deploy it with Docker in minutes and have complete control over your data.",
              },
            },
          ],
        };

      default:
        return baseData;
    }
  };

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: need to set inner html
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getStructuredData()),
      }}
    />
  );
}
