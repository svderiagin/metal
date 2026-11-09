// Title galleries keyed by Category.id or ProductType.id.
const sheetDirectory = "/images/catalog/listovoy-prokat";
const galvanizedCoverDirectory = `${sheetDirectory}/list_ocinkovanniy/cover`;
const coldRolledCoverDirectory = `${sheetDirectory}/list_holodnokataniy/cover`;
const treadPlateCoverDirectory = `${sheetDirectory}/list-refleniy/cover`;
const hotRolledCoverDirectory = `${sheetDirectory}/list_goriachekataniy/cover`;
const channelCoverDirectory = "/images/catalog/shveller/cover";
const angleCoverDirectory = "/images/catalog/ugolok/cover";
const squareCoverDirectory = "/images/catalog/kvadrat/cover";
const rebarCoverDirectory = "/images/catalog/armatura/cover";
const profileTubeCoverDirectory = "/images/catalog/truba-profilnia/cover";
const roundTubeCoverDirectory = "/images/catalog/truba-kruglaya/cover";
const roofingCoverDirectory = "/images/catalog/profnastil/cover";
const meshCoverDirectory = "/images/catalog/setka-metallicheskaya/cover";
const beamCoverDirectory = "/images/catalog/balka/cover";

export const catalogCoverGalleries: Partial<Record<string, {cover?: string; additional: readonly string[]}>> = {
  "cat-arm": {
    cover: `${rebarCoverDirectory}/a400-warehouse-berlion.webp`,
    additional: [
      `${rebarCoverDirectory}/a400-production-veles.jpg`,
      "/images/catalog/armatura.jpg",
      `${rebarCoverDirectory}/a500c-warehouse-meg.webp`,
      `${rebarCoverDirectory}/a240-stock-citymet.jpg`,
    ],
  },
  "type-cat-arm-sub-1": {
    additional: [
      `${rebarCoverDirectory}/a500c-warehouse-meg.webp`,
      `${rebarCoverDirectory}/a500c-bundle-tag.jpg`,
      `${rebarCoverDirectory}/a500c-stock-van-metall.png`,
      `${rebarCoverDirectory}/a500c-yard-metallobaza.jpg`,
    ],
  },
  "type-cat-arm-sub-2": {
    additional: [
      `${rebarCoverDirectory}/a400-35gs-stock-moststal.jpg`,
      `${rebarCoverDirectory}/rebar-warehouse-arcelormittal.jpg`,
    ],
  },
  "type-cat-arm-sub-3": {
    additional: [
      `${rebarCoverDirectory}/a400-25g2s-stock-pkfsst.jpg`,
      `${rebarCoverDirectory}/a400-25g2s-bundles-metallmk.jpg`,
      `${rebarCoverDirectory}/rebar-warehouse-made-in-china.jpg`,
    ],
  },
  "type-cat-arm-sub-4": {
    additional: [
      `${rebarCoverDirectory}/a240-bundle-citymet.jpg`,
      `${rebarCoverDirectory}/a240-rods-metallrs.webp`,
      `${rebarCoverDirectory}/a240-stock-metall-dk.jpg`,
    ],
  },
  "cat-trp": {
    cover: "/images/catalog/truba-profilnia/truba-main.jpg",
    additional: [
      `${profileTubeCoverDirectory}/robmetalstal-square-warehouse.webp`,
      `${profileTubeCoverDirectory}/marketstal-rectangular-bundle.jpg`,
    ],
  },
  "type-cat-trp-sub-1": {
    additional: [
      `${profileTubeCoverDirectory}/stroy-partner-square-ends.jpg`,
      `${profileTubeCoverDirectory}/metamoll-square-detail.jpg`,
    ],
  },
  "type-cat-trp-sub-2": {
    additional: [
      `${profileTubeCoverDirectory}/marketstal-rectangular-bundle.jpg`,
      `${profileTubeCoverDirectory}/gradstal-rectangular-stack.jpg`,
    ],
  },
  "cat-trk": {
    additional: [
      `${roundTubeCoverDirectory}/metservis-welded-warehouse.jpg`,
      `${roundTubeCoverDirectory}/prometey-black-vgp-bundle.webp`,
      `${roundTubeCoverDirectory}/marketstal-galvanized-welded-stock.jpg`,
      `${roundTubeCoverDirectory}/lorber-galvanized-vgp-threads.jpg`,
    ],
  },
  "type-cat-trk-sub-1": {
    additional: [
      `${roundTubeCoverDirectory}/prometey-black-vgp-bundle.webp`,
      `${roundTubeCoverDirectory}/aksvil-black-vgp-ends.jpg`,
    ],
  },
  "type-cat-trk-sub-2": {
    additional: [
      `${roundTubeCoverDirectory}/metservis-welded-warehouse.jpg`,
      `${roundTubeCoverDirectory}/stalnoy-dom-welded-ends.jpg`,
      `${roundTubeCoverDirectory}/ural-welded-stock.jpg`,
    ],
  },
  "type-cat-trk-sub-3": {
    additional: [
      `${roundTubeCoverDirectory}/steel-expert-galvanized-vgp-ends.jpg`,
      `${roundTubeCoverDirectory}/lorber-galvanized-vgp-threads.jpg`,
    ],
  },
  "type-cat-trk-sub-4": {
    additional: [
      `${roundTubeCoverDirectory}/marketstal-galvanized-welded-stock.jpg`,
      `${roundTubeCoverDirectory}/hotoks-galvanized-welded-seam.webp`,
    ],
  },
  "cat-pnf": {
    cover: `${roofingCoverDirectory}/profiled-steel-production.webp`,
    additional: [
      `${roofingCoverDirectory}/s8-coated-packs.webp`,
      `${roofingCoverDirectory}/s20-galvanized-packs.webp`,
      `${roofingCoverDirectory}/n75-galvanized-packs.jpg`,
    ],
  },
  "type-cat-pnf-sub-1": {
    additional: [
      `${roofingCoverDirectory}/s8-coated-packs.webp`,
      `${roofingCoverDirectory}/s8-coated-surface.jpg`,
    ],
  },
  "type-cat-pnf-sub-2": {
    additional: [
      `${roofingCoverDirectory}/s20-galvanized-packs.webp`,
      `${roofingCoverDirectory}/s20-coated-sheets.jpg`,
    ],
  },
  "type-cat-pnf-sub-3": {
    additional: [
      `${roofingCoverDirectory}/n75-galvanized-packs.jpg`,
      `${roofingCoverDirectory}/n75-galvanized-profile.jpg`,
    ],
  },
  "cat-mesh": {
    additional: [
      `${meshCoverDirectory}/rabitsa-warehouse-packs.jpg`,
      `${meshCoverDirectory}/welded-rolls-warehouse.jpg`,
      `${meshCoverDirectory}/welded-panels-stacks.webp`,
    ],
  },
  "type-cat-mesh-sub-1": {
    additional: [
      `${meshCoverDirectory}/rabitsa-warehouse-packs.jpg`,
      `${meshCoverDirectory}/rabitsa-production-rolls.webp`,
    ],
  },
  "type-cat-mesh-sub-2": {
    additional: [
      `${meshCoverDirectory}/welded-rolls-warehouse.jpg`,
      `${meshCoverDirectory}/welded-rolls-packed.jpg`,
    ],
  },
  "type-cat-mesh-sub-3": {
    additional: [
      `${meshCoverDirectory}/welded-panels-stacks.webp`,
      `${meshCoverDirectory}/welded-panels-edges.jpg`,
    ],
  },
  "cat-bal": {
    additional: [
      `${beamCoverDirectory}/normal-parallel-flanges-expo.jpg`,
      `${beamCoverDirectory}/wide-flanges-betall.jpg`,
      `${beamCoverDirectory}/column-stock-sda.jpg`,
      `${beamCoverDirectory}/monorail-taper-expo.jpg`,
    ],
  },
  "type-cat-bal-sub-1": {
    additional: [
      `${beamCoverDirectory}/normal-parallel-flanges-expo.jpg`,
    ],
  },
  "type-cat-bal-sub-2": {
    additional: [
      `${beamCoverDirectory}/wide-flanges-betall.jpg`,
      `${beamCoverDirectory}/wide-stock-betall.jpg`,
    ],
  },
  "type-cat-bal-sub-3": {
    additional: [
      `${beamCoverDirectory}/column-stock-sda.jpg`,
    ],
  },
  "type-cat-bal-sub-4": {
    additional: [
      `${beamCoverDirectory}/monorail-taper-expo.jpg`,
    ],
  },
  "rozmet-cat-shveller": {
    additional: [
      `${channelCoverDirectory}/rigang-channel-bundle.avif`,
      `${channelCoverDirectory}/gradstal-channel-stock.jpg`,
      `${channelCoverDirectory}/artmetal-channel-ends.jpg`,
      `${channelCoverDirectory}/eststeel-channel-profile.jpg`,
    ],
  },
  "rozmet-cat-ugolok": {
    additional: [
      `${angleCoverDirectory}/ostermaier-angle-rack.jpg`,
      `${angleCoverDirectory}/kzmc-angle-bundles.jpg`,
      `${angleCoverDirectory}/marketstal-angle-profile.jpg`,
      `${angleCoverDirectory}/stalmal-angle-ends.jpg`,
    ],
  },
  "rozmet-cat-kvadrat": {
    additional: [
      `${squareCoverDirectory}/tianyuda-square-yard.jpg`,
      `${squareCoverDirectory}/zhongji-square-bundles.jpg`,
      `${squareCoverDirectory}/ozdemir-square-ends.jpg`,
      `${squareCoverDirectory}/metalshoppen-square-profile.jpg`,
    ],
  },
  "type-rozmet-sub-listovoy-prokat-galvanized-steel-sheet": {
    cover: `${galvanizedCoverDirectory}/harcelik.webp`,
    additional: [
      `${galvanizedCoverDirectory}/marketstal-warehouse.webp`,
      `${galvanizedCoverDirectory}/rolled-steel-sheet.jpg`,
      `${galvanizedCoverDirectory}/cs-carbon-steel.jpg`,
      `${galvanizedCoverDirectory}/expo-snab.jpg`,
      `${galvanizedCoverDirectory}/wuxi-gms.jpg`,
      `${galvanizedCoverDirectory}/marketstal-edges.webp`,
      `${galvanizedCoverDirectory}/marketstal-surface.webp`,
    ],
  },
  "type-rozmet-sub-listovoy-prokat-list-ocynkovannyj": {
    cover: `${coldRolledCoverDirectory}/marketstal-sheet-rack.webp`,
    additional: [
      `${coldRolledCoverDirectory}/maras-metal-banded-sheets.jpg`,
      `${coldRolledCoverDirectory}/marketstal-sheet-surface.webp`,
      `${coldRolledCoverDirectory}/marketstal-sheet-edges.webp`,
    ],
  },
  "type-rozmet-sub-listovoy-prokat-list-riflennyj": {
    cover: `${treadPlateCoverDirectory}/sugar-steel-warehouse.jpg`,
    additional: [
      `${treadPlateCoverDirectory}/marketstal-sheet-rack.webp`,
      `${treadPlateCoverDirectory}/total-steel-stacks.jpg`,
      `${treadPlateCoverDirectory}/stalserwis-sheet-edges.jpg`,
      `${treadPlateCoverDirectory}/sugar-steel-tread-detail.jpg`,
    ],
  },
  "type-rozmet-sub-listovoy-prokat-list-goryachekatanyj": {
    cover: `${hotRolledCoverDirectory}/morgan-warehouse.webp`,
    additional: [
      `${hotRolledCoverDirectory}/huale-stacks.webp`,
      `${hotRolledCoverDirectory}/beshert-warehouse.jpg`,
      `${hotRolledCoverDirectory}/ural-sheet-surface.jpg`,
      `${hotRolledCoverDirectory}/marketstal-sheet-edges.webp`,
    ],
  },
  "rozmet-cat-shtaketnik": {
    cover: "/images/catalog/shtaketnik/cover/grand-line-brown-fence.jpg",
    additional: [
      "/images/catalog/shtaketnik/cover/center-mk-graphite-fence.jpg",
      "/images/catalog/shtaketnik/cover/pmzabor-rounded-pickets.jpg",
    ],
  },
  "rozmet-cat-listovoy-prokat": {
    cover: `${hotRolledCoverDirectory}/morgan-warehouse.webp`,
    additional: [
      `${coldRolledCoverDirectory}/marketstal-sheet-rack.webp`,
      `${galvanizedCoverDirectory}/harcelik.webp`,
      `${treadPlateCoverDirectory}/sugar-steel-warehouse.jpg`,
    ],
  },
  "rozmet-cat-polosa": {
    cover: "/images/catalog/polosa/cover/changzeng-hot-rolled-flat-bundles.webp",
    additional: [
      "/images/catalog/polosa/cover/metals4u-flat-bar-end.jpg",
      "/images/catalog/polosa/cover/carbon-flat-bar-yard.webp",
    ],
  },
};
