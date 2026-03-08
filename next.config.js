const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  basePath: "/CCIM-QURAN",
  assetPrefix: "/CCIM-QURAN/",
};

module.exports = withNextIntl(nextConfig);
