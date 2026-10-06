// Replaces every dependency range with the exact version currently installed.
// Usage (from the repo root, after `npm install` in each app): node scripts/pin-versions.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";

for (const app of ["apps/api", "apps/web"]) {
  const file = `${app}/package.json`;
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  for (const key of ["dependencies", "devDependencies"]) {
    for (const name of Object.keys(pkg[key] ?? {})) {
      const installed = `${app}/node_modules/${name}/package.json`;
      if (existsSync(installed)) {
        pkg[key][name] = JSON.parse(readFileSync(installed, "utf8")).version;
      }
    }
  }
  writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`pinned ${file}`);
}