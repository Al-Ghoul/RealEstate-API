{__nixpkgs__, ...}: let
  pkgs = __nixpkgs__;
in
  with pkgs;
    buildNpmPackage rec {
      name = "Linting Job";
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

        npm run lint

        runHook postCheck
      '';

      meta = {
        description = "A job run linter on the source";
      };
    }
