{
  description = "This is a real estate monolithic fullstack application";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-24.05";
    std = {
      url = "github:divnix/std";
      inputs = {
        devshell.url = "github:numtide/devshell";
        arion.url = "github:hercules-ci/arion";
      };
    };
    nixng = {
      url = "github:Al-Ghoul/NixNG";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  nixConfig = {
    extra-trusted-public-keys = "devenv.cachix.org-1:w1cLUi8dv3hnoSPGAuibQv+f9TZLr6cv/Hm9XgU50cw=";
    extra-substituters = "https://devenv.cachix.org";
  };

  outputs = {std, ...} @ inputs:
    std.growOn {
      inherit inputs;
      cellsFrom = ./nix;
      cellBlocks = with std.blockTypes; [
        (devshells "shells")
        (arion "arion-compose")
        
        (runnables "jobs" {ci.build = true;})
        (nixostests "integration" {ci.run = true;})
      ];
    };
}
