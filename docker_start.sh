#!/bin/bash

cp -R -u -p /src/config_dist.js /config/config.js
ln -s /config/config.js /src/config.js
forever start /src/app.js
forever list