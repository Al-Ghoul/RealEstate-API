import fs from "fs";
import yaml from "yaml";
import { openApiDoc } from "./src/docs";

function writeDocumentation() {
  const fileContent = yaml.stringify(openApiDoc);
  fs.writeFileSync("./openapi-spec.yaml", fileContent, {
    encoding: "utf-8",
  });
}

writeDocumentation();
