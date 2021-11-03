docker stop apps-login
docker rm apps-login
docker image rm apps-login:1.0
docker build -t apps-login:1.0 .
docker run --name apps-login -d -p 7004:3001 apps-login:1.0
