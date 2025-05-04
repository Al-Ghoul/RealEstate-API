{
  description = "This is a real estate monolithic fullstack application";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    std = {
      url = "github:divnix/std";
      inputs = {
        devshell.url = "github:numtide/devshell";
        arion.url = "github:hercules-ci/arion";
        nixago.url = "github:nix-community/nixago";
      };
    };
    bun2nix = {
      url = "github:baileyluTCD/bun2nix";
    };
  };

  nixConfig = {
    extra-substituters = [
      "https://cache.nixos.org"
      "https://cache.garnix.io"
    ];
    extra-trusted-public-keys = [
      "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
      "cache.garnix.io:CTFPyKSLcx5RMJKfLo5EEPUObbA78b0YQ2DTCJXqr9g="
    ];
  };

  outputs = {std, ...} @ inputs:
    std.growOn {
      inherit inputs;
      cellsFrom = ./nix;
      cellBlocks = with std.blockTypes; [
        (devshells "shells")
        (arion "docker-compose")
        (nixago "configs")

        (runnables "jobs" {ci.build = true;})
        (nixostests "nixos" {ci.run = true;})

        (installables "packages")
      ];
    };
}
