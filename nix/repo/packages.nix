{
  inputs,
  cell,
}: let
  inherit (inputs) self bun2nix;
in {
  backend = bun2nix.lib.mkBunDerivation rec {
    pname = "RealEstate-Backend";
    src = self + /app;
    inherit ((builtins.fromJSON (builtins.readFile "${src}/package.json"))) version;
    buildFlags = ["--compile" "--minify" "--sourcemap" "--format=esm"];
    bunNix = self + /bun.nix;
    index = "src/server.ts";
  };
}
