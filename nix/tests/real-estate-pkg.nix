{
  nixpkgs,
  src,
}:
nixpkgs.buildNpmPackage rec {
  name = "RealEstate-Backend";
  inherit src;
  inherit ((builtins.fromJSON (builtins.readFile "${src}/package.json"))) version;

  doCheck = true;
  doDist = false;
  dontFixup = true;

  dontNpmBuild = true;
  npmPackFlags = ["--ignore-scripts"];
  npmDepsHash = "sha256-xbyJoKvAHOQdvUwuiHAZTd/A4OqF14NfVQiKOlJyFv0=";
}
