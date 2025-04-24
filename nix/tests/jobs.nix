{
  inputs,
  cell,
}: let
  inherit (inputs) nixpkgs self;
  real-estate-backend = nixpkgs.callPackage (./real-estate-pkg.nix) {
    inherit nixpkgs;
    src = self + /app;
  };
in {
  type-checks-job = real-estate-backend.overrideAttrs {
    name = "Type Check Job";
    checkPhase = ''
      runHook preCheck

      npx tsc --noEmit

      runHook postCheck
    '';
    meta = {
      description = "A job that runs type checks on the source";
    };
  };
  lint-job = real-estate-backend.overrideAttrs {
    name = "Lint Job";
    checkPhase = ''
      runHook preCheck

      npm run lint

      runHook postCheck
    '';
    meta = {
      description = "A job that runs linter on the source";
    };
  };
}
