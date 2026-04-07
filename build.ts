import type { BunPlugin } from "bun";

const stubDevtools: BunPlugin = {
  name: "stub-react-devtools-core",
  setup(build) {
    build.onResolve({ filter: /^react-devtools-core$/ }, () => ({
      path: "react-devtools-core-stub",
      namespace: "stub",
    }));
    build.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
      contents: "export default { connectToDevTools: () => {} };",
      loader: "js",
    }));
  },
};

const result = await Bun.build({
  entrypoints: ["src/index.tsx"],
  outdir: "dist",
  naming: "index.js",
  target: "bun",
  plugins: [stubDevtools],
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

// Make dist/index.js executable
const file = Bun.file("dist/index.js");
const text = await file.text();
if (!text.startsWith("#!/usr/bin/env bun")) {
  await Bun.write("dist/index.js", "#!/usr/bin/env bun\n" + text);
}
await Bun.spawn(["chmod", "+x", "dist/index.js"]).exited;

console.log("Build successful");
