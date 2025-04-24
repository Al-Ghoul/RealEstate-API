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
  npmDepsHash = "sha256-j1wK+onI8v/H2mBBUd0yq14bWDLdX8NZqS6TDY8pns0=";
}
