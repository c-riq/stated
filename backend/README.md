
## Local development

```sh
docker-compose -f database/docker-compose.yml up
# to reapply init.sql: docker-compose -f database/docker-compose.yml up --build
 API_KEY=XXX DOMAIN=localhost nodemon server.js
```
## Installation on Ubuntu

```bash
curl -sL https://deb.nodesource.com/setup_16.x -o /tmp/nodesource_setup.sh
sudo bash /tmp/nodesource_setup.sh
sudo apt-get update
sudo apt-get install -y postgresql nodejs qpdf
sudo su - postgres
psql

CREATE USER sdf WITH SUPERUSER PASSWORD 'sdf';
```
Run all SQL commands from init.sql in the psql prompt. <br />
Exit the sql promt with `exit`, and exit the postgres user shell session by running `exit` again. <br />
```bash
git clone https://github.com/c-riq/stated.git
cd stated/backend
npm install 
# for testing
sudo NODE_ENV=development DOMAIN=XXX API_KEY=XXX PORT=80 node server.js
# for production replace XXX, SSL certificate required
tmux
sudo NODE_ENV=production DOMAIN=XXX API_KEY=XXX SSL_CERT_PATH=/etc/letsencrypt/live/XXX/ node server.js 
```

## Create lets encrypt SSL certificate
```bash
sudo apt install -y certbot
sudo certbot certonly --standalone
```
## Renew lets encrypt certificate

quit node server
<br /> <br />
sudo certbot renew --standalone<br />
<br />
restart node server

