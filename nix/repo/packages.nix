{
  inputs,
  cell,
}: let
  inherit (inputs) self bun2nix;
in {
  real-estate-api = bun2nix.lib.mkBunDerivation rec {
    pname = "RealEstate-API";
    src = self + /app;
    inherit ((builtins.fromJSON (builtins.readFile "${src}/package.json"))) version;
    buildFlags = ["--compile" "--minify" "--sourcemap" "--format=esm"];
    buildPhase = ''
      runHook preBuild
      bun ./node_modules/typesafe-i18n/cli/typesafe-i18n.mjs --no-watch
      bun build $buildFlags --sourcemap $index --outfile ${pname}
      runHook postBuild
    '';
    bunNix = self + /bun.nix;
    index = "src/server.ts";
  };
}
