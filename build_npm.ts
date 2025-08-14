import { build, emptyDir } from "https://deno.land/x/dnt@0.33.1/mod.ts";
import pkg from "./package.json" with { type: "json" };

const tag = Deno.env.get("GITHUB_REF");
const version = tag ? tag.slice(11) : Deno.env.get("VERSION");

if (!version)
	throw new Error("VERSION environment variable not found. Use similar to `VERSION=0.1.0 deno run -A build_npm.ts`");

await emptyDir("./.npm");

await build({
	entryPoints: ["./mod.ts"],
	outDir: "./.npm",
	shims: {},
	test: false,
	compilerOptions: {
		lib: ["es2022"],
	},
	mappings: {
		"https://deno.land/x/telegraf_types@v9.0.0/message.ts": {
			name: "@telegraf/types",
			version: "^9.0.0",
		},
	},
	esModule: false,
	package: {
		name: pkg.name,
		version,
		description: pkg.description,
		keywords: pkg.keywords,
		author: pkg.author,
		license: pkg.license,
		repository: pkg.repository,
		bugs: pkg.bugs,
	},
});

// post build steps
Deno.copyFileSync("LICENSE", ".npm/LICENSE");
Deno.copyFileSync("README.md", ".npm/README.md");
