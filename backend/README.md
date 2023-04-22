
## dev

```sh
docker-compose -f postgres/docker-compose.yml up
# to reapply init.sql: docker-compose -f postgres/docker-compose.yml up --build
 API_KEY=XXX DOMAIN=localhost nodemon server.js
```
## production

 - Update the domain name in ../src/api.js and build the front end files according to ../README.md.<br/>
 - Update the SSL cert paths in backend/server.js according to your domain name.<br/>
 - Modify backend/deploy.sh script with your server's IP/ domain name and run it to copy source files into the server.<br/>
 - Install dependencies and initialize database on the server (Ubuntu):<br/>


```
curl -sL https://deb.nodesource.com/setup_16.x -o /tmp/nodesource_setup.sh
sudo bash /tmp/nodesource_setup.sh
sudo apt-get update

sudo apt-get install postgresql 
sudo su - postgres
psql
CREATE USER sdf WITH SUPERUSER PASSWORD 'sdf';
--run commands from init.sql
--CREATE DATABASE dev
--\c dev
\dt
\q
exit

sudo apt-get install -y nodejs qpdf
npm install
sudo npm install -g nodemon
```
Copy files using the script in scp.sh with your server details. <br />
Use tmux (or something similar) for runinng to the node server
```
sudo NODE_ENV=production DOMAIN=rixdata.net API_KEY=XXX nodemon --ignore 'log/*' server.js 
# sudo NODE_ENV=production DOMAIN=gritapp.info nodemon --ignore 'log/*' server.js
```

## Create lets encrypt SSL certificate
```
sudo apt install certbot
sudo certbot certonly --standalone
```
## Renew lets encrypt certificate

quit node server
<br /> <br />
sudo certbot renew --standalone<br />
<br />
Stop NginX or Apache if they were used for the cert renewal</br>
sudo nginx stop <br />
sudo nginx -s quit <br />
<br /> <br />
or<br />
sudo service apache2 stop<br />
sudo lsof -i :443<br />
sudo kill -9 <br />
<br />
restart node server

