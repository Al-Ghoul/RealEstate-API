{
  inputs,
  cell,
}: let
  inherit (inputs.cells.repo.packages) real-estate-api;
in {
  type-checks-job = real-estate-api.overrideAttrs {
    name = "Type Check Job";
    phases = [
      "unpackPhase"
      "configurePhase"
      "checkPhase"
      "installPhase"
    ];
    doCheck = true;
    checkPhase = ''
      runHook preCheck
      bunx tsc --noEmit
      runHook postCheck
    '';
    installPhase = ''
      mkdir $out
    '';
    meta = {
      description = "A job that runs type checks on the source";
    };
  };
  lint-job = real-estate-api.overrideAttrs {
    name = "Lint Job";
    phases = [
      "unpackPhase"
      "configurePhase"
      "checkPhase"
      "installPhase"
    ];
    doCheck = true;
    checkPhase = ''
      runHook preCheck
      bun lint
      runHook postCheck
    '';
    installPhase = ''
      mkdir $out
    '';
    meta = {
      description = "A job that runs linter on the source";
    };
  };
}
