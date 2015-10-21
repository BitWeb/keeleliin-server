#!/bin/bash

if [ ! -f /config/config.js ]; then
    cp -R -u -p /src/config_dist.js /config/config.js
fi

ln -s /config/config.js /src/config.js
forever start /src/app.js
forever list