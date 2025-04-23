{__nixpkgs__, ...}: let
  pkgs = __nixpkgs__;
in
  with pkgs;
    buildNpmPackage rec {
      name = "Type Checking Job";
      src = ../../app;
      inherit ((builtins.fromJSON (builtins.readFile "${src}/package.json"))) version;

      doCheck = true;
      doDist = false;
      dontFixup = true;

      dontNpmBuild = true;
      npmPackFlags = ["--ignore-scripts"];
      npmDepsHash = "sha256-j1wK+onI8v/H2mBBUd0yq14bWDLdX8NZqS6TDY8pns0=";

      checkPhase = ''
        runHook preCheck

        npx tsc --noEmit

        runHook postCheck
      '';

      meta = {
        description = "A job that run type checks on the source";
      };
    }
