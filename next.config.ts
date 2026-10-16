import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [{
      source: "/images/:path*",
      has: [{type: "query", key: "v", value: "[a-f0-9]{12}"}],
      headers: [{key: "Cache-Control", value: "public, max-age=31536000, immutable"}],
    }];
  },
  async redirects() {
    return [
      {"source":"/catalog/truby-stalnye/truba-vodogazoprovodnaya/:path*","destination":"/catalog/truba-kruglaya/truba-vodogazoprovodnaya/:path*","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya/:path*","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/:path*","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-vodogazoprovodnaya-15x28x6000-gost-3262-tm","destination":"/catalog/truba-kruglaya/truba-vodogazoprovodnaya/truba-vodogazoprovodnaya#variant-local-258","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-vodogazoprovodnaya-40x35x12000-gost-3262-tm","destination":"/catalog/truba-kruglaya/truba-vodogazoprovodnaya/truba-vodogazoprovodnaya#variant-local-277","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-vodogazoprovodnaya-50x35x12000-gost-3262-tm","destination":"/catalog/truba-kruglaya/truba-vodogazoprovodnaya/truba-vodogazoprovodnaya#variant-local-281","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-57x3x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-302","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-57x35x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-305","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-76x3x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-309","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-76x35x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-311","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-76x4x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-313","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-89x35x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-316","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-89x4x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-318","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-133x45x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-333","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-159x4x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-337","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-oc-89x35x7800-gost-10704-10705-tagmet-tm-150mm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya-otsinkovannaya/truba-elektrosvarnaya-otsinkovannaya#variant-local-443","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-vodogazoprovodnaya-oc-25x28x7800-gost-3262-tagmet-tm-150mm","destination":"/catalog/truba-kruglaya/truba-vodogazoprovodnaya-otsinkovannaya/truba-vodogazoprovodnaya-otsinkovannaya#variant-local-984","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-108x45x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-3963","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-vodogazoprovodnaya-20x28x6000-gost-3262-tm","destination":"/catalog/truba-kruglaya/truba-vodogazoprovodnaya/truba-vodogazoprovodnaya#variant-local-6204","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-vodogazoprovodnaya-32x28x6000-gost-3262-tm","destination":"/catalog/truba-kruglaya/truba-vodogazoprovodnaya/truba-vodogazoprovodnaya#variant-local-6224","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-219x4x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-9211","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-219x5x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-40706","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-219x6x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-40707","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-273x6x12000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-52334","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-127x4x12000-gost-10704-10705-st20-vmz-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-53918","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-vodogazoprovodnaya-32x32x6000-gost-3262-tm","destination":"/catalog/truba-kruglaya/truba-vodogazoprovodnaya/truba-vodogazoprovodnaya#variant-local-54870","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-vodogazoprovodnaya-25x28x6000-gost-3262-tm","destination":"/catalog/truba-kruglaya/truba-vodogazoprovodnaya/truba-vodogazoprovodnaya#variant-local-56374","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-273x8-gost-10704-10705-st20-vmz-tm-nd-11-12m","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-58627","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-325x7-gost-10704-10705-st20-vmz-tm-nd-11-12m","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-58631","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-325x10-gost-10704-10705-st20-vmz-tm-nd-11-12m","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-58634","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-57x3x12000-gost-10704-10705-st20-vmz-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-62388","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-pryamosovnaya-48x3x6000-gost-10704-10705-tm","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-local-125936","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-12","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-prd-073","permanent":true},
      {"source":"/catalog/truby-stalnye/truba-elektrosvarnaya-20","destination":"/catalog/truba-kruglaya/truba-elektrosvarnaya/truba-elektrosvarnaya#variant-prd-074","permanent":true},
      {"source":"/catalog/balka/balka-25s1x12000-gost-27772-s255-tm","destination":"/catalog/balka/balka-shirokopolochnaya/balka-shirokopolochnaya#variant-local-122247","permanent":true},
      {"source":"/catalog/balka/balka-30s1x12000-gost-27772-s255-tm","destination":"/catalog/balka/balka-shirokopolochnaya/balka-shirokopolochnaya#variant-local-115982","permanent":true},
      {"source":"/catalog/balka/balka-20k1x12000-gost-27772-s255-tm","destination":"/catalog/balka/balka-kolonnaya/balka-kolonnaya#variant-local-11123500","permanent":true},
      {"source":"/catalog/balka/balka-30k2x12000-gost-27772-s255-tm","destination":"/catalog/balka/balka-kolonnaya/balka-kolonnaya#variant-local-122249","permanent":true},
      {"source":"/catalog/balka/balka-40s2x12000-gost-27772-s255-tm","destination":"/catalog/balka/balka-shirokopolochnaya/balka-shirokopolochnaya#variant-local-118168","permanent":true},
      {"source":"/catalog/balka/balka-20s2x12000-gost-35087-27772-s255-tm","destination":"/catalog/balka/balka-shirokopolochnaya/balka-shirokopolochnaya#variant-local-73573","permanent":true},
      {source: "/catalog/balka/balka-20b1x12000-gost-27772-s255-tm", destination: "/catalog/balka/balka-normalnaya/balka-normalnaya#variant-local-122248", permanent: true},
      {source: "/catalog/balka/balka", destination: "/catalog/balka", permanent: true},
      {source: "/catalog/balka/balka/balka", destination: "/catalog/balka", permanent: true},
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 320, 384, 480],
    localPatterns: [
      {pathname: "/images/hero/**"},
      {pathname: "/images/catalog/**"},
      {pathname: "/**", search: ""},
    ],
  },
};

export default nextConfig;
