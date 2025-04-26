{
  inputs,
  cell,
}: let
  inherit (inputs.std) lib;
  inherit (inputs.nixng) nglib;
  real-estate-api-image = let
    real-estate-api-build =
      (inputs.nixpkgs.callPackage ../../tests/real-estate-api-pkg.nix
        {
          inherit (inputs) nixpkgs;
          src = inputs.self + /app;
        })
      .overrideAttrs
      {
        inherit (inputs) nixpkgs;
        src = inputs.self + /app;
        npmPackFlags = ["--ignore-scripts"];
        dontNpmBuild = false;
        doCheck = false;
        installPhase = ''
          runHook preInstall

          mkdir -p $out/bin
          mkdir $out/bin/real-estate-api

          cp -r ./dist/* $out/bin/real-estate-api/
          cp -r ./node_modules $out/bin/real-estate-api/node_modules

          # Copy migrations & Config
          cp -r ./drizzle $out/bin/real-estate-api/
          cp ./drizzle.config.ts $out/bin/real-estate-api/drizzle.config.ts

          runHook postInstall
        '';
      };

    entry-script = inputs.nixpkgs.writeScript "entry-script.sh" ''
      #!${inputs.nixpkgs.runtimeShell}
      ./node_modules/.bin/drizzle-kit migrate
      rm -rf ./drizzle          # delete migrations
      rm ./drizzle.config.ts    # delete config
      npm prune --omit=dev      # strip dev dependencies
      node ./server.js
    '';
  in
    inputs.nixpkgs.dockerTools.buildLayeredImage {
      name = "RealEstate-API";
      tag = "latest";

      contents = [
        inputs.nixpkgs.dockerTools.caCertificates
        inputs.nixpkgs.coreutils
        inputs.nixpkgs.nodejs
        real-estate-api-build
      ];

      extraCommands = ''
        mkdir -p ./bin/real-estate-api/public/uploads/profile-images
      '';

      config = {
        Cmd = ["${entry-script}"];
        WorkingDir = "/bin/real-estate-api";
        ExposedPorts = {
          "80/tcp" = {};
        };
        Env = [
          "TZ=Europe/Berlin" # This is not used directly by the api but some libs might use it internally, (setting it won't do any harm) do ur own research.
          # Services connections
          "DATABASE_URL=postgres://db_owner:secure_password@real-estate-postgres-service:5433/realestatedb"
          "REDIS_URL=redis://:secure_password@real-estate-redis-service:6379"
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
          # File upload settings
          "UPLOAD_PATH=/bin/real-estate-api/public/uploads/profile-images"
          "PUBLIC_PATH=/bin/real-estate-api/public"
        ];
      };
    };

  db-image = nglib.makeSystem {
    inherit (inputs) nixpkgs;
    system = "x86_64-linux";
    name = "real-estate-postgres-service";
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
    real-estate-api = {
      project.name = "real-estate-api";
      docker-compose.volumes = {
        db-data = {};
        redis-data = {};
        uploads-data = {};
      };

      services = {
        real-estate-api = {
          build.image =
            inputs.nixpkgs.lib.mkForce real-estate-api-image;
          service = {
            container_name = "RealEstate-API";
            stop_signal = "SIGINT";
            ports = ["80:80"];
            links = ["real-estate-postgres-service" "real-estate-redis-service"];
            volumes = ["uploads-data:/bin/real-estate-api/public/"];
            depends_on = {"real-estate-postgres-service" = {condition = "service_healthy";};};
          };
        };

        real-estate-postgres-service = {
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
