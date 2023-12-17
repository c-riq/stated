
## Local development

```sh
docker-compose -f database/docker-compose.yml up
# to reapply init.sql: docker-compose -f database/docker-compose.yml up --build
 API_KEY=XXX DOMAIN=localhost nodemon server.js
```
## Installation on Ubuntu

### 1. Setup server and Domain
#### AWS
In the AWS console navigate to EC2 and launch an instance with the following properties
- Ubuntu version 22 
- Instance type t2.nano
- Allow HTTPS and HTTP traffic
- Generate and save a key pair to log into the server
To log into the server, run the following command in your terminal (replace the key file path and IP address):
```bash
ssh -i ./key.pem ubuntu@54.175.130.112
```
This instance costs around (0.006 USD per hour)[https://aws.amazon.com/ec2/instance-types/t2/], so around 4 USD per month.
#### Domain name setup
Add an `A` record for the `stated.` subdomain in your domain name management (such as godaddy.com) with the IP address of the server.
### 2. Create a <i>let's encrypt</i> SSL certificate for HTTPS
Skip this part, if you already have a certificate
```bash
sudo apt-get update
sudo apt install -y certbot
sudo certbot certonly --standalone
```

### 3. Install dependencies

```bash
# or follow instructions on https://github.com/nodesource/distributions#installation-instructions
curl -sL https://deb.nodesource.com/setup_16.x -o /tmp/nodesource_setup.sh
sudo bash /tmp/nodesource_setup.sh
sudo apt-get update
sudo apt-get install -y postgresql nodejs qpdf
sudo su - postgres
psql
# replace with secure credentials and fine grained access
CREATE USER sdf WITH SUPERUSER PASSWORD 'sdf';
CREATE DATABASE stated;
```
Exit the sql promt with `exit`, and exit the postgres user shell session by running `exit` again. <br />

### 4. Install Stated

```bash
sudo apt-get install unzip
wget https://github.com/c-riq/stated/releases/download/v1.0.22/release.zip
unzip -o release.zip -d stated && rm release.zip
# replace DOMAIN, API_KEY and SSL_CERT_PATH below
tmux
cd stated
sudo NODE_ENV=production DOMAIN=2.rixdata.net API_KEY=dOhewi9GhjoLkgiXhnq0N1 SSL_CERT_PATH=/etc/letsencrypt/live/stated.2.rixdata.net/ node index.js
```
Exit tmux by `CTRL + b` then `d`.

### Maintenance

## Renewing lets encrypt certificate after 90 days

quit node server <br />
run
```bash
sudo certbot renew --standalone
```
restart node server

