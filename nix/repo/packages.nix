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
    bunNix = self + /bun.nix;
    index = "src/server.ts";
  };
}
