{
  inputs,
  cell,
}: let
  inherit (inputs.cells.repo.packages) real-estate-api;
in {
  types-check-job = real-estate-api.overrideAttrs {
    name = "Types Check Job";
    phases = [
      "unpackPhase"
      "configurePhase"
      "checkPhase"
      "installPhase"
    ];
    doCheck = true;
    checkPhase = ''
      runHook preCheck
      # HINT: We run this because we skip the build phase
      bun ./node_modules/typesafe-i18n/cli/typesafe-i18n.mjs --no-watch
      bunx tsc --noEmit
      runHook postCheck
    '';
    installPhase = ''
      mkdir $out
    '';
    meta = {
      description = "A job that runs types check on the source";
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
      # HINT: We run this because we skip the build phase
      bun ./node_modules/typesafe-i18n/cli/typesafe-i18n.mjs --no-watch
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
