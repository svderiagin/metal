// Title galleries keyed by Category.id or ProductType.id.

export const catalogCoverGalleries: Partial<Record<string, {cover?: string; additional: readonly string[]}>> = {
  "cat-arm": {
    cover: "/images/catalog/armatura-card.webp",
    additional: [
      "/images/catalog/armatura/gallery/a400-rebar-production.jpg",
      "/images/catalog/armatura/gallery/armatura.jpg",
      "/images/catalog/armatura/armatura-a500s/gallery/a500c-rebar-warehouse.webp",
      "/images/catalog/armatura/gallery/a240-bar-stacks.jpg",
    ],
  },
  "type-cat-arm-sub-1": {
    additional: [
      "/images/catalog/armatura/armatura-a500s/gallery/a500c-rebar-warehouse.webp",
      "/images/catalog/armatura/armatura-a500s/gallery/a500c-rebar-bundle.jpg",
      "/images/catalog/armatura/armatura-a500s/gallery/a500c-rebar-stock.png",
      "/images/catalog/armatura/armatura-a500s/gallery/a500c-rebar-yard.jpg",
    ],
  },
  "type-cat-arm-sub-2": {
    additional: [
      "/images/catalog/armatura/armatura-a3-35gs-a400s/gallery/a400-35gs-rebar-stock.jpg",
      "/images/catalog/armatura/armatura-a3-35gs-a400s/gallery/a400-35gs-rebar-warehouse.jpg",
    ],
  },
  "type-cat-arm-sub-3": {
    additional: [
      "/images/catalog/armatura/armatura-a3-25g2s/gallery/a400-25g2s-rebar-stock.jpg",
      "/images/catalog/armatura/armatura-a3-25g2s/gallery/a400-25g2s-rebar-bundles.jpg",
      "/images/catalog/armatura/armatura-a3-25g2s/gallery/a400-25g2s-rebar-warehouse.jpg",
    ],
  },
  "type-cat-arm-sub-4": {
    additional: [
      "/images/catalog/armatura/armatura-a1-a240/gallery/a240-bar-bundle.jpg",
      "/images/catalog/armatura/armatura-a1-a240/gallery/a240-bar-ends.webp",
      "/images/catalog/armatura/armatura-a1-a240/gallery/a240-bar-stock.jpg",
    ],
  },
  "cat-trp": {
    cover: "/images/catalog/truby-profilnye/gallery/truba-main.jpg",
    additional: [
      "/images/catalog/truby-profilnye/gallery/square-tube-warehouse.webp",
      "/images/catalog/truby-profilnye/truba-profilnaya-pryamougolnaya/gallery/rectangular-tube-bundle.jpg",
    ],
  },
  "type-cat-trp-sub-1": {
    additional: [
      "/images/catalog/truby-profilnye/truba-profilnaya-kvadratnaya/gallery/square-tube-ends.jpg",
      "/images/catalog/truby-profilnye/truba-profilnaya-kvadratnaya/gallery/square-tube-detail.jpg",
    ],
  },
  "type-cat-trp-sub-2": {
    additional: [
      "/images/catalog/truby-profilnye/truba-profilnaya-pryamougolnaya/gallery/rectangular-tube-bundle.jpg",
      "/images/catalog/truby-profilnye/truba-profilnaya-pryamougolnaya/gallery/rectangular-tube-stack.jpg",
    ],
  },
  "cat-trk": {
    additional: [
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya/gallery/welded-pipe-warehouse.jpg",
      "/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya/gallery/black-vgp-bundle.webp",
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya-otsinkovannaya/gallery/galvanized-welded-pipe-stock.jpg",
      "/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya-otsinkovannaya/gallery/galvanized-vgp-threads.jpg",
    ],
  },
  "type-cat-trk-sub-1": {
    additional: [
      "/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya/gallery/black-vgp-bundle.webp",
      "/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya/gallery/black-vgp-ends.jpg",
    ],
  },
  "type-cat-trk-sub-2": {
    additional: [
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya/gallery/welded-pipe-warehouse.jpg",
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya/gallery/welded-pipe-ends.jpg",
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya/gallery/welded-pipe-stock.jpg",
    ],
  },
  "type-cat-trk-sub-3": {
    additional: [
      "/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya-otsinkovannaya/gallery/galvanized-vgp-ends.jpg",
      "/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya-otsinkovannaya/gallery/galvanized-vgp-threads.jpg",
    ],
  },
  "type-cat-trk-sub-4": {
    additional: [
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya-otsinkovannaya/gallery/galvanized-welded-pipe-stock.jpg",
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya-otsinkovannaya/gallery/galvanized-pipe-welded-seam.webp",
    ],
  },
  "cat-pnf": {
    cover: "/images/catalog/profnastil/gallery/profiled-steel-production.webp",
    additional: [
      "/images/catalog/profnastil/profnastil-s8/gallery/s8-coated-packs.webp",
      "/images/catalog/profnastil/profnastil-s20/gallery/s20-galvanized-packs.webp",
      "/images/catalog/profnastil/profnastil-n75/gallery/n75-galvanized-packs.jpg",
    ],
  },
  "type-cat-pnf-sub-1": {
    additional: [
      "/images/catalog/profnastil/profnastil-s8/gallery/s8-coated-packs.webp",
      "/images/catalog/profnastil/profnastil-s8/gallery/s8-coated-surface.jpg",
    ],
  },
  "type-cat-pnf-sub-2": {
    additional: [
      "/images/catalog/profnastil/profnastil-s20/gallery/s20-galvanized-packs.webp",
      "/images/catalog/profnastil/profnastil-s20/gallery/s20-coated-sheets.jpg",
    ],
  },
  "type-cat-pnf-sub-3": {
    additional: [
      "/images/catalog/profnastil/profnastil-n75/gallery/n75-galvanized-packs.jpg",
      "/images/catalog/profnastil/profnastil-n75/gallery/n75-galvanized-profile.jpg",
    ],
  },
  "cat-mesh": {
    additional: [
      "/images/catalog/setka-metallicheskaya/setka-rabitsa/gallery/rabitsa-warehouse-packs.jpg",
      "/images/catalog/setka-metallicheskaya/setka-svarnaya-v-rulonah/gallery/welded-rolls-warehouse.jpg",
      "/images/catalog/setka-metallicheskaya/setka-svarnaya-v-kartah/gallery/welded-panels-stacks.webp",
    ],
  },
  "type-cat-mesh-sub-1": {
    additional: [
      "/images/catalog/setka-metallicheskaya/setka-rabitsa/gallery/rabitsa-warehouse-packs.jpg",
      "/images/catalog/setka-metallicheskaya/setka-rabitsa/gallery/rabitsa-production-rolls.webp",
    ],
  },
  "type-cat-mesh-sub-2": {
    additional: [
      "/images/catalog/setka-metallicheskaya/setka-svarnaya-v-rulonah/gallery/welded-rolls-warehouse.jpg",
      "/images/catalog/setka-metallicheskaya/setka-svarnaya-v-rulonah/gallery/welded-rolls-packed.jpg",
    ],
  },
  "type-cat-mesh-sub-3": {
    additional: [
      "/images/catalog/setka-metallicheskaya/setka-svarnaya-v-kartah/gallery/welded-panels-stacks.webp",
      "/images/catalog/setka-metallicheskaya/setka-svarnaya-v-kartah/gallery/welded-panels-edges.jpg",
    ],
  },
  "cat-bal": {
    additional: [
      "/images/catalog/balka/balka-normalnaya/gallery/normal-parallel-flanges.jpg",
      "/images/catalog/balka/balka-shirokopolochnaya/gallery/wide-flanges-profile.jpg",
      "/images/catalog/balka/balka-kolonnaya/gallery/column-beam-stock.jpg",
      "/images/catalog/balka/balka-monorelsovaya/gallery/monorail-beam-taper.jpg",
    ],
  },
  "type-cat-bal-sub-1": {
    additional: [
      "/images/catalog/balka/balka-normalnaya/gallery/normal-parallel-flanges.jpg",
    ],
  },
  "type-cat-bal-sub-2": {
    additional: [
      "/images/catalog/balka/balka-shirokopolochnaya/gallery/wide-flanges-profile.jpg",
      "/images/catalog/balka/balka-shirokopolochnaya/gallery/wide-beam-stock.jpg",
    ],
  },
  "type-cat-bal-sub-3": {
    additional: [
      "/images/catalog/balka/balka-kolonnaya/gallery/column-beam-stock.jpg",
    ],
  },
  "type-cat-bal-sub-4": {
    additional: [
      "/images/catalog/balka/balka-monorelsovaya/gallery/monorail-beam-taper.jpg",
    ],
  },
  "catalog-cat-shveller": {
    additional: [
      "/images/catalog/shveller/gallery/channel-bundle.avif",
      "/images/catalog/shveller/gallery/channel-stock.jpg",
      "/images/catalog/shveller/gallery/channel-ends.jpg",
      "/images/catalog/shveller/gallery/channel-profile.jpg",
    ],
  },
  "catalog-cat-ugolok": {
    additional: [
      "/images/catalog/ugolok/gallery/angle-rack.jpg",
      "/images/catalog/ugolok/gallery/angle-bundles.jpg",
      "/images/catalog/ugolok/gallery/angle-profile.jpg",
      "/images/catalog/ugolok/gallery/angle-ends.jpg",
    ],
  },
  "catalog-cat-kvadrat": {
    additional: [
      "/images/catalog/kvadrat/gallery/square-bar-yard.jpg",
      "/images/catalog/kvadrat/gallery/square-bar-bundles.jpg",
      "/images/catalog/kvadrat/gallery/square-bar-ends.jpg",
      "/images/catalog/kvadrat/gallery/square-bar-profile.jpg",
    ],
  },
  "type-catalog-sub-listovoy-prokat-galvanized-steel-sheet": {
    cover: "/images/catalog/listovoy-prokat/galvanized-steel-sheet/gallery/galvanized-sheet-warehouse.webp",
    additional: [
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/gallery/galvanized-sheet-stock.webp",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/gallery/rolled-steel-sheet.jpg",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/gallery/galvanized-sheet-coils.jpg",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/gallery/galvanized-sheet-packs.jpg",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/gallery/galvanized-sheet-edges.jpg",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/gallery/galvanized-sheet-stack-edges.webp",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/gallery/galvanized-sheet-surface.webp",
    ],
  },
  "type-catalog-sub-listovoy-prokat-list-ocynkovannyj": {
    cover: "/images/catalog/listovoy-prokat/list-ocynkovannyj/gallery/steel-sheet-rack.webp",
    additional: [
      "/images/catalog/listovoy-prokat/list-ocynkovannyj/gallery/cold-rolled-banded-sheets.jpg",
      "/images/catalog/listovoy-prokat/list-ocynkovannyj/gallery/cold-rolled-sheet-surface.webp",
      "/images/catalog/listovoy-prokat/list-ocynkovannyj/gallery/sheet-stack-edges.webp",
    ],
  },
  "type-catalog-sub-listovoy-prokat-list-riflennyj": {
    cover: "/images/catalog/listovoy-prokat/list-riflennyj/gallery/tread-plate-warehouse.jpg",
    additional: [
      "/images/catalog/listovoy-prokat/list-riflennyj/gallery/steel-sheet-rack.webp",
      "/images/catalog/listovoy-prokat/list-riflennyj/gallery/tread-plate-stacks.jpg",
      "/images/catalog/listovoy-prokat/list-riflennyj/gallery/tread-plate-edges.jpg",
      "/images/catalog/listovoy-prokat/list-riflennyj/gallery/tread-pattern-detail.jpg",
    ],
  },
  "type-catalog-sub-listovoy-prokat-list-goryachekatanyj": {
    cover: "/images/catalog/listovoy-prokat/list-goryachekatanyj/gallery/hot-rolled-sheet-warehouse.webp",
    additional: [
      "/images/catalog/listovoy-prokat/list-goryachekatanyj/gallery/hot-rolled-sheet-stacks.webp",
      "/images/catalog/listovoy-prokat/list-goryachekatanyj/gallery/hot-rolled-sheet-rack.jpg",
      "/images/catalog/listovoy-prokat/list-goryachekatanyj/gallery/hot-rolled-sheet-surface.jpg",
      "/images/catalog/listovoy-prokat/list-goryachekatanyj/gallery/sheet-stack-edges.webp",
    ],
  },
  "catalog-cat-shtaketnik": {
    cover: "/images/catalog/shtaketnik/gallery/brown-picket-fence.jpg",
    additional: [
      "/images/catalog/shtaketnik/gallery/graphite-picket-fence.jpg",
      "/images/catalog/shtaketnik/gallery/rounded-fence-pickets.jpg",
    ],
  },
  "catalog-cat-listovoy-prokat": {
    cover: "/images/catalog/listovoy-prokat/list-goryachekatanyj/gallery/hot-rolled-sheet-warehouse.webp",
    additional: [
      "/images/catalog/listovoy-prokat/list-ocynkovannyj/gallery/steel-sheet-rack.webp",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/gallery/galvanized-sheet-warehouse.webp",
      "/images/catalog/listovoy-prokat/list-riflennyj/gallery/tread-plate-warehouse.jpg",
    ],
  },
  "catalog-cat-polosa": {
    cover: "/images/catalog/polosa/gallery/hot-rolled-flat-bar-bundles.webp",
    additional: [
      "/images/catalog/polosa/gallery/steel-flat-bar-end.jpg",
      "/images/catalog/polosa/gallery/carbon-flat-bar-yard.webp",
    ],
  },
};
