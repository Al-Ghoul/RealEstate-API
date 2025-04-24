{
  inputs,
  cell,
}: let
  pkgs = inputs.nixpkgs;
  real-estate-backend =
    pkgs.callPackage
    ./real-estate-pkg.nix
    {
      nixpkgs = pkgs;
      src = inputs.self + /app;
    };
in {
  integration = pkgs.testers.runNixOSTest {
    name = "Real-Estate Integration Test";

    nodes = {
      machine = {pkgs, ...}: {
        virtualisation.memorySize = 1524;

        environment.systemPackages = [
          (real-estate-backend.overrideAttrs {
            installPhase = ''
              runHook preInstall

              mkdir -p $out/bin

              mkdir $out/bin/real-estate-backend

              cp -r . $out/bin/real-estate-backend/

              rm -rf $out/bin/real-estate-backend/drizzle
              rm $out/bin/real-estate-backend/.env.development.example

              runHook postInstall
            '';
          })
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

      machine.succeed("cd /run/current-system/sw/bin/real-estate-backend && npm run test:integration")
      machine.shutdown()
    '';
  };
}
