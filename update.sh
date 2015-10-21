#!/bin/bash

cd /src
git pull
npm install
forever restartall
forever list