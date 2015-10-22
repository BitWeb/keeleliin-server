FROM    ubuntu:14.04

MAINTAINER priit@bitweb.ee

RUN apt-get update && \
    apt-get -y install curl && \
    curl -sL https://deb.nodesource.com/setup | sudo bash - && \
    apt-get -y install python build-essential nodejs && \
    apt-get -y install git

RUN npm install -g forever
RUN mkdir -p /src


RUN cd /src && \
git clone 'https://github.com/BitWeb/keeleliin-server.git' . && \
npm install && echo "Run is Done 2.1"

#Expose port
EXPOSE  3000

VOLUME ["/tmp","/keeleliin_files","/keeleliin_logs", "/config"]

CMD /./src/docker_start.sh && /bin/bash