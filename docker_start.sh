#!/bin/bash

cp -R -u -p /src/config_dist.js /config/config.js
ln -s /src/config.js /config/config.js
forever start /src/app.js
forever list