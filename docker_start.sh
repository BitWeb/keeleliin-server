#!/bin/bash

if [ ! -f /config/config.js ]; then
    cp -R -u -p /src/config_dist.js /config/config.js
fi

if [ ! -f /src/config.js ]; then
    ln -s /config/config.js /src/config.js
fi

forever start -l /forever.log /src/app.js
forever list

tail -f /forever.log