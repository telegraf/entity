import { build, emptyDir } from "https://deno.land/x/dnt@0.32.1/mod.ts";
import pkg from "./package.json" assert { type: "json" };

await emptyDir("./.npm");

// @ts-ignore
delete pkg.main, delete pkg.types, delete pkg.scripts;

await build({
	entryPoints: ["./mod.ts"],
	outDir: "./.npm",
	shims: { deno: { test: "dev" } },
	mappings: { "https://deno.land/x/typegram@v5.0.0/mod.ts": { name: "typegram", version: "^5.0.0" } },
	package: { ...pkg, version: Deno.args[0] },
});

// post build steps
Deno.copyFileSync("LICENSE", ".npm/LICENSE");
Deno.copyFileSync("README.md", ".npm/README.md");
