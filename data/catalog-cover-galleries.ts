// Title galleries keyed by Category.id or ProductType.id.

export const catalogCoverGalleries: Partial<Record<string, {cover?: string; additional: readonly string[]}>> = {
  "cat-arm": {
    cover: "/images/catalog/armatura/main/a400-rebar-warehouse.webp",
    additional: [
      "/images/catalog/armatura/cover/a400-rebar-production.jpg",
      "/images/catalog/armatura/main/armatura.jpg",
      "/images/catalog/armatura/armatura-a500s/cover/a500c-rebar-warehouse.webp",
      "/images/catalog/armatura/cover/a240-bar-stacks.jpg",
    ],
  },
  "type-cat-arm-sub-1": {
    additional: [
      "/images/catalog/armatura/armatura-a500s/cover/a500c-rebar-warehouse.webp",
      "/images/catalog/armatura/armatura-a500s/cover/a500c-rebar-bundle.jpg",
      "/images/catalog/armatura/armatura-a500s/cover/a500c-rebar-stock.png",
      "/images/catalog/armatura/armatura-a500s/cover/a500c-rebar-yard.jpg",
    ],
  },
  "type-cat-arm-sub-2": {
    additional: [
      "/images/catalog/armatura/armatura-a3-35gs-a400s/cover/a400-35gs-rebar-stock.jpg",
      "/images/catalog/armatura/armatura-a3-35gs-a400s/cover/a400-35gs-rebar-warehouse.jpg",
    ],
  },
  "type-cat-arm-sub-3": {
    additional: [
      "/images/catalog/armatura/armatura-a3-25g2s/cover/a400-25g2s-rebar-stock.jpg",
      "/images/catalog/armatura/armatura-a3-25g2s/cover/a400-25g2s-rebar-bundles.jpg",
      "/images/catalog/armatura/armatura-a3-25g2s/cover/a400-25g2s-rebar-warehouse.jpg",
    ],
  },
  "type-cat-arm-sub-4": {
    additional: [
      "/images/catalog/armatura/armatura-a1-a240/cover/a240-bar-bundle.jpg",
      "/images/catalog/armatura/armatura-a1-a240/cover/a240-bar-ends.webp",
      "/images/catalog/armatura/armatura-a1-a240/cover/a240-bar-stock.jpg",
    ],
  },
  "cat-trp": {
    cover: "/images/catalog/truby-profilnye/main/truba-main.jpg",
    additional: [
      "/images/catalog/truby-profilnye/cover/square-tube-warehouse.webp",
      "/images/catalog/truby-profilnye/truba-profilnaya-pryamougolnaya/cover/rectangular-tube-bundle.jpg",
    ],
  },
  "type-cat-trp-sub-1": {
    additional: [
      "/images/catalog/truby-profilnye/truba-profilnaya-kvadratnaya/cover/square-tube-ends.jpg",
      "/images/catalog/truby-profilnye/truba-profilnaya-kvadratnaya/cover/square-tube-detail.jpg",
    ],
  },
  "type-cat-trp-sub-2": {
    additional: [
      "/images/catalog/truby-profilnye/truba-profilnaya-pryamougolnaya/cover/rectangular-tube-bundle.jpg",
      "/images/catalog/truby-profilnye/truba-profilnaya-pryamougolnaya/cover/rectangular-tube-stack.jpg",
    ],
  },
  "cat-trk": {
    additional: [
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya/cover/welded-pipe-warehouse.jpg",
      "/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya/cover/black-vgp-bundle.webp",
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya-otsinkovannaya/cover/galvanized-welded-pipe-stock.jpg",
      "/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya-otsinkovannaya/cover/galvanized-vgp-threads.jpg",
    ],
  },
  "type-cat-trk-sub-1": {
    additional: [
      "/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya/cover/black-vgp-bundle.webp",
      "/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya/cover/black-vgp-ends.jpg",
    ],
  },
  "type-cat-trk-sub-2": {
    additional: [
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya/cover/welded-pipe-warehouse.jpg",
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya/cover/welded-pipe-ends.jpg",
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya/cover/welded-pipe-stock.jpg",
    ],
  },
  "type-cat-trk-sub-3": {
    additional: [
      "/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya-otsinkovannaya/cover/galvanized-vgp-ends.jpg",
      "/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya-otsinkovannaya/cover/galvanized-vgp-threads.jpg",
    ],
  },
  "type-cat-trk-sub-4": {
    additional: [
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya-otsinkovannaya/cover/galvanized-welded-pipe-stock.jpg",
      "/images/catalog/truba-kruglaya/truba-elektrosvarnaya-otsinkovannaya/cover/galvanized-pipe-welded-seam.webp",
    ],
  },
  "cat-pnf": {
    cover: "/images/catalog/profnastil/main/profiled-steel-production.webp",
    additional: [
      "/images/catalog/profnastil/profnastil-s8/cover/s8-coated-packs.webp",
      "/images/catalog/profnastil/profnastil-s20/cover/s20-galvanized-packs.webp",
      "/images/catalog/profnastil/profnastil-n75/cover/n75-galvanized-packs.jpg",
    ],
  },
  "type-cat-pnf-sub-1": {
    additional: [
      "/images/catalog/profnastil/profnastil-s8/cover/s8-coated-packs.webp",
      "/images/catalog/profnastil/profnastil-s8/cover/s8-coated-surface.jpg",
    ],
  },
  "type-cat-pnf-sub-2": {
    additional: [
      "/images/catalog/profnastil/profnastil-s20/cover/s20-galvanized-packs.webp",
      "/images/catalog/profnastil/profnastil-s20/cover/s20-coated-sheets.jpg",
    ],
  },
  "type-cat-pnf-sub-3": {
    additional: [
      "/images/catalog/profnastil/profnastil-n75/cover/n75-galvanized-packs.jpg",
      "/images/catalog/profnastil/profnastil-n75/cover/n75-galvanized-profile.jpg",
    ],
  },
  "cat-mesh": {
    additional: [
      "/images/catalog/setka-metallicheskaya/setka-rabitsa/cover/rabitsa-warehouse-packs.jpg",
      "/images/catalog/setka-metallicheskaya/setka-svarnaya-v-rulonah/cover/welded-rolls-warehouse.jpg",
      "/images/catalog/setka-metallicheskaya/setka-svarnaya-v-kartah/cover/welded-panels-stacks.webp",
    ],
  },
  "type-cat-mesh-sub-1": {
    additional: [
      "/images/catalog/setka-metallicheskaya/setka-rabitsa/cover/rabitsa-warehouse-packs.jpg",
      "/images/catalog/setka-metallicheskaya/setka-rabitsa/cover/rabitsa-production-rolls.webp",
    ],
  },
  "type-cat-mesh-sub-2": {
    additional: [
      "/images/catalog/setka-metallicheskaya/setka-svarnaya-v-rulonah/cover/welded-rolls-warehouse.jpg",
      "/images/catalog/setka-metallicheskaya/setka-svarnaya-v-rulonah/cover/welded-rolls-packed.jpg",
    ],
  },
  "type-cat-mesh-sub-3": {
    additional: [
      "/images/catalog/setka-metallicheskaya/setka-svarnaya-v-kartah/cover/welded-panels-stacks.webp",
      "/images/catalog/setka-metallicheskaya/setka-svarnaya-v-kartah/cover/welded-panels-edges.jpg",
    ],
  },
  "cat-bal": {
    additional: [
      "/images/catalog/balka/balka-normalnaya/cover/normal-parallel-flanges.jpg",
      "/images/catalog/balka/balka-shirokopolochnaya/cover/wide-flanges-profile.jpg",
      "/images/catalog/balka/balka-kolonnaya/cover/column-beam-stock.jpg",
      "/images/catalog/balka/balka-monorelsovaya/cover/monorail-beam-taper.jpg",
    ],
  },
  "type-cat-bal-sub-1": {
    additional: [
      "/images/catalog/balka/balka-normalnaya/cover/normal-parallel-flanges.jpg",
    ],
  },
  "type-cat-bal-sub-2": {
    additional: [
      "/images/catalog/balka/balka-shirokopolochnaya/cover/wide-flanges-profile.jpg",
      "/images/catalog/balka/balka-shirokopolochnaya/cover/wide-beam-stock.jpg",
    ],
  },
  "type-cat-bal-sub-3": {
    additional: [
      "/images/catalog/balka/balka-kolonnaya/cover/column-beam-stock.jpg",
    ],
  },
  "type-cat-bal-sub-4": {
    additional: [
      "/images/catalog/balka/balka-monorelsovaya/cover/monorail-beam-taper.jpg",
    ],
  },
  "catalog-cat-shveller": {
    additional: [
      "/images/catalog/shveller/cover/channel-bundle.avif",
      "/images/catalog/shveller/cover/channel-stock.jpg",
      "/images/catalog/shveller/cover/channel-ends.jpg",
      "/images/catalog/shveller/cover/channel-profile.jpg",
    ],
  },
  "catalog-cat-ugolok": {
    additional: [
      "/images/catalog/ugolok/cover/angle-rack.jpg",
      "/images/catalog/ugolok/cover/angle-bundles.jpg",
      "/images/catalog/ugolok/cover/angle-profile.jpg",
      "/images/catalog/ugolok/cover/angle-ends.jpg",
    ],
  },
  "catalog-cat-kvadrat": {
    additional: [
      "/images/catalog/kvadrat/cover/square-bar-yard.jpg",
      "/images/catalog/kvadrat/cover/square-bar-bundles.jpg",
      "/images/catalog/kvadrat/cover/square-bar-ends.jpg",
      "/images/catalog/kvadrat/cover/square-bar-profile.jpg",
    ],
  },
  "type-catalog-sub-listovoy-prokat-galvanized-steel-sheet": {
    cover: "/images/catalog/listovoy-prokat/galvanized-steel-sheet/cover/galvanized-sheet-warehouse.webp",
    additional: [
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/cover/galvanized-sheet-stock.webp",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/cover/rolled-steel-sheet.jpg",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/cover/galvanized-sheet-coils.jpg",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/cover/galvanized-sheet-packs.jpg",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/cover/galvanized-sheet-edges.jpg",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/cover/galvanized-sheet-stack-edges.webp",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/cover/galvanized-sheet-surface.webp",
    ],
  },
  "type-catalog-sub-listovoy-prokat-list-ocynkovannyj": {
    cover: "/images/catalog/listovoy-prokat/list-ocynkovannyj/cover/steel-sheet-rack.webp",
    additional: [
      "/images/catalog/listovoy-prokat/list-ocynkovannyj/cover/cold-rolled-banded-sheets.jpg",
      "/images/catalog/listovoy-prokat/list-ocynkovannyj/cover/cold-rolled-sheet-surface.webp",
      "/images/catalog/listovoy-prokat/list-ocynkovannyj/cover/sheet-stack-edges.webp",
    ],
  },
  "type-catalog-sub-listovoy-prokat-list-riflennyj": {
    cover: "/images/catalog/listovoy-prokat/list-riflennyj/cover/tread-plate-warehouse.jpg",
    additional: [
      "/images/catalog/listovoy-prokat/list-riflennyj/cover/steel-sheet-rack.webp",
      "/images/catalog/listovoy-prokat/list-riflennyj/cover/tread-plate-stacks.jpg",
      "/images/catalog/listovoy-prokat/list-riflennyj/cover/tread-plate-edges.jpg",
      "/images/catalog/listovoy-prokat/list-riflennyj/cover/tread-pattern-detail.jpg",
    ],
  },
  "type-catalog-sub-listovoy-prokat-list-goryachekatanyj": {
    cover: "/images/catalog/listovoy-prokat/list-goryachekatanyj/cover/hot-rolled-sheet-warehouse.webp",
    additional: [
      "/images/catalog/listovoy-prokat/list-goryachekatanyj/cover/hot-rolled-sheet-stacks.webp",
      "/images/catalog/listovoy-prokat/list-goryachekatanyj/cover/hot-rolled-sheet-rack.jpg",
      "/images/catalog/listovoy-prokat/list-goryachekatanyj/cover/hot-rolled-sheet-surface.jpg",
      "/images/catalog/listovoy-prokat/list-goryachekatanyj/cover/sheet-stack-edges.webp",
    ],
  },
  "catalog-cat-shtaketnik": {
    cover: "/images/catalog/shtaketnik/main/brown-picket-fence.jpg",
    additional: [
      "/images/catalog/shtaketnik/cover/graphite-picket-fence.jpg",
      "/images/catalog/shtaketnik/cover/rounded-fence-pickets.jpg",
    ],
  },
  "catalog-cat-listovoy-prokat": {
    cover: "/images/catalog/listovoy-prokat/list-goryachekatanyj/cover/hot-rolled-sheet-warehouse.webp",
    additional: [
      "/images/catalog/listovoy-prokat/list-ocynkovannyj/cover/steel-sheet-rack.webp",
      "/images/catalog/listovoy-prokat/galvanized-steel-sheet/cover/galvanized-sheet-warehouse.webp",
      "/images/catalog/listovoy-prokat/list-riflennyj/cover/tread-plate-warehouse.jpg",
    ],
  },
  "catalog-cat-polosa": {
    cover: "/images/catalog/polosa/main/hot-rolled-flat-bar-bundles.webp",
    additional: [
      "/images/catalog/polosa/cover/steel-flat-bar-end.jpg",
      "/images/catalog/polosa/cover/carbon-flat-bar-yard.webp",
    ],
  },
};
