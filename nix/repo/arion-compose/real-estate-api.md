# Real Estate API

We use nix to build, containerize the project and its related services, and Arion to declare our deployments of them services.

Images:

1. real-estate-api - The Real Estate API.
1. real-estate-postgres-service - Postgres service that hosts the database.
1. real-estate-redis-service - Redis service that hosts the cache.

the aforementioned images are built from the source code and create the following services:

1. RealEstate-API - contains the Express backend—API
2. RealEstate-Postgres - contains the Postgres database service
3. RealEstate-Redis - contains the Redis cache service

## Configuration

The following environment variables are *required* for the Real Estate API to run:

```sh
TZ=Europe/Berlin # This is not used directly by the backend but some libs might use it internally, (setting it won't do any harm) do ur own research.
# Services connections
DATABASE_URL=postgres://db_owner:secure_password@real-estate-postgres-service:5433/realestatedb
REDIS_URL=redis://:secure_password@real-estate-redis-service:6379
# Application settings
NODE_ENV=production
PORT=80
# JWT settings
TOKEN_ISSUER=http://localhost
# Use openssl to generate a pair of keys
# $ openssl rand -base64 64
JWT_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
JWT_KEY=XXXXXXXXXXXXXXXXXXXXXXXX
# Email settings (we use gmail for mailing for now)
GMAIL_USER=XXXXXXXXXXXXX@gmail.com
GMAIL_PASSWORD='XXXXXXXXXXXXXXXXXXX' # This is NOT your email's password, check nodemailer's docs for more info
# Social auth settings
FACEBOOK_APP_ID=XXXXXXXXXXXXXXX
FACEBOOK_APP_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_CLIENT_ID=XXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=XXXXXX-XXXX-XXXXXXXXXXXXXXXXXXXXXXX
# File upload settings
UPLOAD_PATH=/bin/real-estate-backend/public/uploads/profile-images
PUBLIC_PATH=/bin/real-estate-backend/public
```


## Reference

1. [Docker Compose](https://docs.docker.com/compose/reference/#docker-compose-yaml)
2. [Arion](https://docs.hercules-ci.com/arion/)
3. [Facebook Login](https://developers.facebook.com/docs/facebook-login)
4. [Google Login](https://developers.google.com/identity/sign-in/web/sign-in)
