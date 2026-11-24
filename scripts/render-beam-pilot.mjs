// Preview or write the four pilot products using the current owner-supplied templates.
import {readFile} from "node:fs/promises";
const pilots = JSON.parse(await readFile(new URL("../imports/beam-image-template/pilot.json", import.meta.url), "utf8"));
process.argv.push(...Object.keys(pilots));
await import("./render-beam-images.mjs");
