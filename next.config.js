const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/CCIM-QURAN",
  assetPrefix: "/CCIM-QURAN/",
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;