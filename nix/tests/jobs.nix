{
  inputs,
  cell,
}: let
  inherit (inputs) nixpkgs self;
  real-estate-api = nixpkgs.callPackage ./real-estate-api-pkg.nix {
    inherit nixpkgs;
    src = self + /app;
  };
in {
  type-checks-job = real-estate-api.overrideAttrs {
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
  lint-job = real-estate-api.overrideAttrs {
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
