import { Helmet } from "react-helmet-async";

const SITE_NAME = "Krittika Style";
const SITE_URL  = "https://www.krittikasarees.com";
const DEFAULT_DESC =
  "Discover handwoven sarees crafted by master artisans — Banarasi silk, Kanjivaram, Handloom cotton, and more. Shop the Krittika Style collection with free delivery across India.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

/**
 * SEOHead — drop this inside any page component to control <head>.
 *
 * Props:
 *  title       string   Page-specific title (appended with " | Krittika Style")
 *  description string   Meta description (≤155 chars)
 *  canonical   string   Full canonical URL for this page
 *  image       string   OG image URL (absolute)
 *  type        string   OG type ("website" | "product" | "article")  default: website
 *  noindex     bool     Set true for auth/private pages
 *  schema      object|array  JSON-LD structured data object(s)
 */
const SEOHead = ({
  title,
  description = DEFAULT_DESC,
  canonical,
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  schema,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Handwoven Sarees from India`;
  const canonicalUrl = canonical || SITE_URL;

  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];

  return (
    <Helmet>
      {/* Core */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type"        content={type} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url"         content={canonicalUrl} />
      <meta property="og:image"       content={image} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:locale"      content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />

      {/* JSON-LD structured data */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
