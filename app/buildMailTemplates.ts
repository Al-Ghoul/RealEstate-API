import pug from "pug";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, basename } from "path";

const viewsDir = "./src/lib/templates";
const outFile = "./src/lib/mailTemplates.ts";

const files = readdirSync(viewsDir).filter((f) => f.endsWith(".pug"));

let result = `// AUTO-GENERATED — do not edit
import pugRuntime from "pug-runtime";

type Locals = Record<string, any>;

`;

for (const file of files) {
  const base = basename(file, ".pug");
  const filePath = join(viewsDir, file);
  const source = readFileSync(filePath, "utf8");

  const compiled = pug.compileClient(source, {
    name: `template_${base}`,
    compileDebug: false,
    inlineRuntimeFunctions: true,
  });

  result += `// -------- ${file} --------
                              ${compiled}

                            export const ${base} = (locals: Locals = {}) =>
                              template_${base}(locals, pugRuntime);

                              `;
}

writeFileSync(outFile, result);
console.log(`✅ Generated ${outFile}`);
