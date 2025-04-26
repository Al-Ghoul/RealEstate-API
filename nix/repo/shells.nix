{
  inputs,
  cell,
}: let
  inherit (inputs.std) lib std;
in
  builtins.mapAttrs (_: lib.dev.mkShell) {
    # Tool Homepage: https://numtide.github.io/devshell/
    default = {
      name = "Real Estate Dev Shell";

      imports = [std.devshellProfiles.default];

      nixago = [
        cell.configs.treefmt
      ];

      commands = [
        {package = inputs.nixpkgs.nodejs;}
      ];
    };
  }
