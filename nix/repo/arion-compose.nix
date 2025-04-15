{
  inputs,
  cell,
}: let
  inherit (inputs.std) lib;
  inherit (inputs.nixng) nglib;
  db-image = nglib.makeSystem {
    inherit (inputs) nixpkgs;
    system = "x86_64-linux";
    name = "real-estate-db-service-postgres";
    config = {pkgs, ...}: {
      config = {
        dumb-init = {
          enable = true;
          type.services = {};
        };
        nix = {
          loadNixDb = true;
          persistNix = "/nix-persist";
          config = {
            experimental-features = ["nix-command" "flakes"];
            sandbox = true;
            trusted-public-keys = [
              "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
            ];
            substituters = ["https://cache.nixos.org/"];
          };
        };
        services.postgresql = {
          enable = true;
          package = pkgs.postgresql;
          enableTCPIP = true;
          initdbArgs = ["--encoding=UTF-8" "--locale=C"];
          port = 5433;
          initialScript = pkgs.writeText "db-initScript" ''
            CREATE USER db_owner WITH LOGIN PASSWORD 'secure_password';
            GRANT ALL PRIVILEGES ON DATABASE realestatedb TO db_owner;
            \c realestatedb;
            GRANT ALL ON SCHEMA public TO db_owner;
          '';
          ensureDatabases = ["realestatedb"];
          authentication = ''
            host    all             db_owner             0.0.0.0/0            md5
          '';
        };
      };
    };
  };
in
  builtins.mapAttrs (_: lib.dev.mkArion) {
    real-estate-db = {
      project.name = "real-estate-db";
      docker-compose.volumes = {
        db-data = {};
        redis-data = {};
      };

      services = {
        real-estate-db-service = {
          build.image =
            inputs.nixpkgs.lib.mkForce
            db-image
            .config
            .system
            .build
            .ociImage
            .build;
          service = {
            useHostStore = true;
            container_name = "RealEstate-Postgres";
            stop_signal = "SIGINT";
            ports = ["5433:5433"];
            volumes = ["db-data:/var/lib/postgresql/data"];
          };
        };

        real-estate-redis-service = {
          build.image = inputs.nixpkgs.lib.mkForce (inputs.nixpkgs.dockerTools.buildImage {
            name = "real-estate-redist-service";
            tag = "latest";

            copyToRoot = inputs.nixpkgs.buildEnv {
              name = "image-root";
              paths = [
                inputs.nixpkgs.redis
              ];
              pathsToLink = ["/bin"];
            };

            runAsRoot = ''
              mkdir /data
            '';

            config = {
              Cmd = ["/bin/redis-server" "--requirepass" "secure_password"];
              WorkingDir = "/data";
              ExposedPorts = {
                "6379/tcp" = {};
              };
            };
          });

          service = {
            useHostStore = true;
            container_name = "RealEstate-Redist";
            stop_signal = "SIGINT";
            ports = ["6379:6379"];
            volumes = ["redis-data:/data"];
          };
        };
      };
    };
  }
