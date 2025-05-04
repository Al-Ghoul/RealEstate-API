{
  inputs,
  cell,
}: let
  inherit (inputs.std) lib;
  real-estate-api-image = let
    real-estate-api-build =
      inputs
      .cells
      .repo
      .packages
      .real-estate-api;
    entrypoint = inputs.nixpkgs.writeShellScriptBin "entrypoint" ''
      cd /app
      bun add sharp # needed for image processing
      RealEstate-API
    '';
  in
    inputs.nixpkgs.dockerTools.buildLayeredImage {
      name = "real-estate-api";
      tag = "latest";

      contents = [
        inputs.nixpkgs.dockerTools.caCertificates
        inputs.nixpkgs.coreutils
        inputs.nixpkgs.dockerTools.binSh
        inputs.nixpkgs.bun
        real-estate-api-build
      ];

      extraCommands = ''
        mkdir -p ./app/public/uploads/profile-images
        mkdir -p ./app/log
      '';

      config = {
        Entrypoint = "${entrypoint}/bin/entrypoint";
        Cmd = ["RealEstate-API"];

        Stopsignal = "SIGINT";

        ExposedPorts = {
          "80/tcp" = {};
        };

        Env = [
          "LD_LIBRARY_PATH=${inputs.nixpkgs.stdenv.cc.cc.lib}/lib" # Required by sharp
          "TZ=Europe/Berlin" # This is not used directly by the api but some libs might use it internally, (setting it won't do any harm) do ur own research.
          # Services connections
          "DATABASE_URL=postgres://db_owner:secure_password@real-estate-postgres:5433/realestatedb"
          "REDIS_URL=redis://:secure_password@real-estate-redis:6379"
          # Application settings
          "NODE_ENV=production"
          "PORT=80"
          # JWT settings
          "TOKEN_ISSUER=http://localhost"
          # Use openssl to generate a pair of keys
          # $ openssl rand -base64 64
          "JWT_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          "JWT_KEY=XXXXXXXXXXXXXXXXXXXXXXXX"
          # Email settings (we use gmail for mailing for now)
          "GMAIL_USER=XXXXXXXXXXXXX@gmail.com"
          "GMAIL_PASSWORD='XXXXXXXXXXXXXXXXXXX'" # This is NOT your email's password, check nodemailer's docs for more info
          # Social auth settings
          "FACEBOOK_APP_ID=XXXXXXXXXXXXXXX"
          "FACEBOOK_APP_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          "GOOGLE_CLIENT_ID=XXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com"
          "GOOGLE_CLIENT_SECRET=XXXXXX-XXXX-XXXXXXXXXXXXXXXXXXXXXXX"
        ];
      };
    };

  db-image = let
    postgresPackage = inputs.nixpkgs.postgresql;
    postgresConf = inputs.nixpkgs.writeText "postgresql.conf" ''
      listen_addresses = '*'
      port = 5433
      log_connections = on
      log_destination = 'stderr'
      log_disconnections = on
      log_duration = on
      log_statement = 'all'
    '';
    postgresServiceDir = ".real-estate/services/postgres";
    postgresInitdbArgs = ["--locale=C" "--encoding=UTF8"];
    entrypoint = inputs.nixpkgs.writeShellScriptBin "entrypoint" ''
      set -euo pipefail

      mkdir -p $PGDATA

      if [ ! -f $PGDATA/PG_VERSION ]; then
        initdb \
          --username $PGUSER \
          --pgdata $PGDATA \
          ${inputs.nixpkgs.lib.concatStringsSep " " postgresInitdbArgs}

        cat "${postgresConf}" >> $PGDATA/postgresql.conf
        echo "host  all  all  0.0.0.0/0  trust" >> $PGDATA/pg_hba.conf

        echo -e "\nPostgreSQL init process complete. Ready for start up.\n"
      fi

      ${postgresPackage}/bin/postgres --single -D $PGDATA template1 <<EOF
        CREATE USER db_owner WITH PASSWORD 'secure_password';
        CREATE DATABASE realestatedb OWNER db_owner;
      EOF
      exec ${postgresPackage}/bin/"$@"
    '';
  in
    inputs.nixpkgs.dockerTools.buildLayeredImage {
      name = "real-estate-postgres";
      tag = "latest";

      contents = [
        postgresPackage
        entrypoint

        inputs.nixpkgs.coreutils

        inputs.nixpkgs.dockerTools.binSh

        (inputs.nixpkgs.dockerTools.fakeNss.override
          {
            extraPasswdLines = ["postgres:x:9001:9001:PostgreSQL:$PGDATA:/bin/false"];
            extraGroupLines = ["postgres:x:9001:"];
          })
      ];

      extraCommands = ''
        mkdir data tmp
        chmod 777 data tmp
      '';

      config = {
        User = "9001:9001";

        Env = [
          "PGDATA=/data/${postgresServiceDir}"
          "PGHOST=/data/${postgresServiceDir}"
          "PGUSER=postgres"
          "PGPORT=5433"
        ];

        Entrypoint = "${entrypoint}/bin/entrypoint";
        Cmd = ["postgres" "-k" "/data/${postgresServiceDir}"];
        Stopsignal = "SIGINT";

        ExposedPorts = {
          "5433/tcp" = {};
        };
      };
    };
in
  builtins.mapAttrs (_: lib.dev.mkArion) {
    real-estate-api = {
      project.name = "real-estate-api";
      docker-compose.volumes = {
        postgres-data = {};
        redis-data = {};
        api-data = {};
      };

      services = {
        real-estate-api = {
          build.image =
            inputs.nixpkgs.lib.mkForce real-estate-api-image;
          service = {
            container_name = "RealEstate-API";
            stop_signal = "SIGINT";
            ports = ["80:80"];
            links = ["real-estate-postgres" "real-estate-redis"];
            volumes = ["api-data:/public/:/log"];
            depends_on = {"real-estate-postgres" = {condition = "service_healthy";};};
          };
        };

        real-estate-postgres = {
          build.image =
            inputs.nixpkgs.lib.mkForce db-image;
          service = {
            useHostStore = true;
            container_name = "RealEstate-Postgres";
            stop_signal = "SIGINT";
            ports = ["5433:5433"];
            volumes = ["postgres-data:/data"];
            healthcheck = {
              test = [
                "CMD-SHELL"
                "${inputs.nixpkgs.postgresql}/bin/pg_isready -U db_owner -d realestatedb -p 5433"
              ];
              interval = "30s";
              timeout = "60s";
              start_period = "80s";
              retries = 5;
            };
          };
        };

        real-estate-redis = {
          build.image = inputs.nixpkgs.lib.mkForce (inputs.nixpkgs.dockerTools.buildImage {
            name = "real-estate-redis";
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
            container_name = "RealEstate-Redis";
            stop_signal = "SIGINT";
            ports = ["6379:6379"];
            volumes = ["redis-data:/data"];
          };
        };
      };
    };
  }
