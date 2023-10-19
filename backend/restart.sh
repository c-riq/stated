#!/bin/bash

# On EC2 nano instances, the server gets killed occasionally.
# This happens only when the verification monitoring option is enabled. 
# Possibly related to the high number of delv commands in childprcesses.
# This script is a workaround to keep the server running.
# It checks if node server is running and healthy every 5 seconds and restarts if needed.

MAX_MEMORY_MB=80
DOMAIN=gritapp.info
API_KEY=XXX
SSL_CERT_PATH=/etc/letsencrypt/live/stated.gritapp.info/
VERIFICATION_LOG=true

restart_server() {
    lsof -i :80 -t | xargs kill
    NODE_ENV=production DOMAIN=${DOMAIN} API_KEY=${API_KEY} SSL_CERT_PATH=${SSL_CERT_PATH} VERIFICATION_LOG=${VERIFICATION_LOG} node --max-old-space-size=${MAX_MEMORY_MB} ./index.js &
}

while true  
do  
    curl --fail http://127.0.0.1:80 -X GET &>/dev/null
    _status=$( echo $? )
    if [[ $_status == 0 ]] ; then
        echo "Server ok"
    else
        echo "Restart server"
        restart_server
    fi
    sleep 10
done
