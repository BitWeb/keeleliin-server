# Projekti käivitamine dockeriga

* Loo config.js fail

$ cp config_dist.js config.js

* Muuda config.js failis kliendirakenduse aadressi, api key ja emaili kontode väärtuseid

* Loo dockeri konteinerite välised kaustad

$ cd /

$ mkdir keeleliin_server_data

$ cd keeleliin_server_data

$ mkdir redis_data

$ mkdir postgres_data

$ mkdir tmp

$ mkdir keeleliin_files

*   RUN OPTIONS
*   -d                  Jooksuta taustal
*   --rm                Serveri sulgemisel kustuta konteiner
*   --restart=no
*   --restart=always
* Konteinerit taustal jookustamiseks eemalda --rm ja kasuta --restart=always ning lisa -d

* RUN REDIS SERVER

$ docker run --name kl_redis --rm -v /keeleliin_server_data/redis_data:/data --restart=no redis

* RUN POSTGRES SERVER

$ docker run --name kl_postgres --rm -p 5433:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -v /keeleliin_server_data/postgres_data:/var/lib/postgresql/data --restart=no postgres:9.3

* BUILD SERVER

$  docker build -t kl_server .

* RUN KEELELIIN SERVER

$ docker run --name kl_server --rm -p 8000:3000 --link kl_redis:redis --link kl_postgres:postgres -v /keeleliin_server_data:/keeleliin_logs -v /keeleliin_server_data/tmp:/tmp -v /keeleliin_server_data/keeleliin_files:/keeleliin_files --restart=no kl_server


