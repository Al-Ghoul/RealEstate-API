{
  inputs,
  cell,
}: let
  inherit (inputs) self nixpkgs;
in {
  backend = nixpkgs.buildNpmPackage rec {
    pname = "RealEstate-Backend";
    src = self + /app;
    inherit ((builtins.fromJSON (builtins.readFile "${src}/package.json"))) version;

    doDist = false;
    dontFixup = true;

    dontNpmBuild = true;
    npmPackFlags = ["--ignore-scripts"];
    npmDepsHash = "sha256-01DPkFEOM5a2E5vikBtQSTizUqrMURQDb8OaxJu1oLI=";
  };
}
