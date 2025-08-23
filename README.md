This is a chat application enables users in an organization chat with each other.
There is prebuilt version of this app in docker, to use it execute following commands:

```bash
$ docker network create collabcomm-network
$ docker run -d --name postgres-db --network collabcomm-network -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=collabpass -e POSTGRES_DB=collab_comm -p 5432:5432 -v pgdata:/var/lib/postgresql/data postgres:16
$ docker run -d --name mongo-db --network collabcomm-network -p 27017:27017 -v mongodata:/data/db mongo:7.0
$ docker run -d --name app --network collabcomm-network -p 8080:8080 -e POSTGRESQL_CONNECTION_STRING="Server=postgres-db;Port=5432;Database=collab_comm;User Id=postgres;Password=collabpass;Application Name=CollabComm;" -e $ MONGO_URL="mongodb://mongo-db:27017" -e MONGO_DB=CollabComm mohammadnt/collabcomm:latest
```
