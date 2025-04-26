{
  inputs,
  cell,
}: let
  pkgs = inputs.nixpkgs;
  real-estate-api-build =
    (pkgs.callPackage ./real-estate-api-pkg.nix
      {
        nixpkgs = pkgs;
        src = inputs.self + /app;
      })
    .overrideAttrs {
      doCheck = false;
      installPhase = ''
        runHook preInstall

        mkdir -p $out/bin

        mkdir $out/bin/real-estate-api

        cp -r . $out/bin/real-estate-api

        mv $out/bin/real-estate-api/.env.development.example $out/bin/real-estate-api/.env.development.local

        runHook postInstall
      '';
    };
in {
  smoke = pkgs.testers.runNixOSTest {
    name = "Real-Estate Smoke Tests";

    nodes = {
      machine = {pkgs, ...}: {
        virtualisation.memorySize = 1524;

        environment.systemPackages = [
          real-estate-api-build
          pkgs.nodejs
        ];

        services.postgresql = {
          enable = true;
          settings.port = 5433;
          initdbArgs = ["--encoding=UTF-8" "--locale=C"];
          initialScript = pkgs.writeText "db-initScript" ''
            CREATE USER db_owner WITH LOGIN PASSWORD 'secure_password';
            CREATE DATABASE realestatedb WITH OWNER db_owner ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C';
            GRANT ALL PRIVILEGES ON DATABASE realestatedb TO db_owner;
            \c realestatedb;
            GRANT ALL ON SCHEMA public TO db_owner;
          '';
        };

        services.redis.servers = {
          "" = {
            enable = true;
            requirePass = "secure_password";
          };
        };
      };
    };

    testScript = ''
      machine.systemctl("start network-online.target")
      machine.wait_for_unit("network-online.target")

      machine.wait_for_unit("postgresql")
      machine.wait_for_unit("redis")

      machine.wait_for_open_port(6379)
      machine.wait_for_open_port(5433)

      machine.succeed("cd /run/current-system/sw/bin/real-estate-api && npm run db:runmigrations")
      machine.succeed("cd /run/current-system/sw/bin/real-estate-api && npm run test:smoke")
      machine.shutdown()
    '';
  };
}
