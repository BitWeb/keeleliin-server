# Projekti käivitamine dockeris

* Loo dockeri konteinerite välised kaustad
 
	$ mkdir /keeleliin_server_data

	$ mkdir /keeleliin_server_data/config

	$ mkdir /keeleliin_server_data/redis_data

	$ mkdir /keeleliin_server_data/postgres_data

	$ mkdir /keeleliin_server_data/tmp

	$ mkdir /keeleliin_server_data/keeleliin_files



* Käivita Redis server 

	$ docker run --name kl_redis --rm -v /keeleliin_server_data/redis_data:/data --restart=no redis

	* Käivita Postgres server

	$ docker run --name kl_postgres --rm -p 5433:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -v /keeleliin_server_data/postgres_data:/var/lib/postgresql/data --restart=no postgres:9.3



* Lae alla keeleliin-server Dockerfile

* Loo dockeri Image fail

	$  docker build -t kl_server .

* Käivita loodud image kl_server

	$ docker run -it --name kl_server -p 3000:3000 --link kl_redis:redis --link kl_postgres:postgres -v /keeleliin_server_data:/keeleliin_logs -v /keeleliin_server_data/tmp:/tmp -v /keeleliin_server_data/keeleliin_files:/keeleliin_files -v /keeleliin_server_data/config:/config --restart=always kl_server

* Serverist väljumiseks : Ctrl + P Q
	


* Muuda /keeleliin_server_data/config/config.js failis kliendirakenduse aadressi, api key ja emaili kontode väärtuseid


* Uuenda konteinerit

	$ docker exec kl_server /src/docker_update.sh


# Serveri koodibaasi uuendamine

	$ docker exec kl_server /src/docker_update.sh

