#!/bin/bash

ssh -t root@dev.bitweb.ee "
    cd /var/www/bitweb.ee/keeleliin.bitweb.ee/server/
    git pull
    npm install
    echo 'server ok'

    cd /var/www/bitweb.ee/keeleliin.bitweb.ee/keeleliin-files/
    git pull
    echo 'klient ok'

    echo 'Restart forever'
    forever restartall
    echo 'List forever'
    forever list
    "

    # forever start /var/www/bitweb.ee/keeleliin.bitweb.ee/wrapper/morph_tagger/app.js