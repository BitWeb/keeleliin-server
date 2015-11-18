#!/bin/bash

cd /src
git pull
npm install

cd /src
nodejs node_modules/.bin/sequelize  db:migrate

forever restartall