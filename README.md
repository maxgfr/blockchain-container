# blockchain-container

An API using [this project](https://github.com/maxgfr/api-php-container).

## AFTER A REBOOT
```shell
sudo reboot
ssh -i ....
nvm use 8.11.2
sudo systemctl restart docker
sudo ~/fabric-dev-servers/./startFabric.sh
cd ~/blockchain-container/dist/
#composer network reset -c PeerAdmin@magma-network -v 1.0.0
composer network install -c PeerAdmin@magma-network -a magma.bna
composer network start --networkName magma-network --networkVersion 1.0.0 -A admin -S adminpw -c PeerAdmin@magma-network
```

## GLOBAL DEPENDENCIES
```shell
#On ubuntu 16.04 server
sudo apt-get update
sudo apt-get updgrade
sudo apt-get update
sudo apt-get install build-essential
sudo apt-get install g++
sudo apt-get install python
sudo apt-get install golang-go
sudo apt-get -y upgrade
ssh-keygen
```

## NVM
```shell
#sudo su
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
#nvm install node
#nvm use node stable
nvm install 8.11.2
nvm use node 8.11.2
```


## DOCKER INSTALL
```shell
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
sudo apt-get update
sudo apt-get install docker-ce
```

## DOCKER-COMPOSE INSTALL
```shell
sudo curl -L https://github.com/docker/compose/releases/download/1.21.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```


## HYPERLEDGER
```shell
npm install -g composer-cli
npm install -g composer-rest-server
npm install -g yo
npm install -g generator-hyperledger-composer
```

```shell
mkdir ~/fabric-dev-servers && cd ~/fabric-dev-servers

curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.tar.gz
tar -xvf fabric-dev-servers.tar.gz
```

```shell
cd ~/fabric-dev-servers
sudo ./stopFabric.sh
sudo ./teardownFabric.sh
sudo ./downloadFabric.sh
sudo ./startFabric.sh
```

### IF YOU HAVE A PROBLEM
```shell
npm uninstall -g composer-cli
npm uninstall -g composer-rest-server
npm uninstall -g yo
npm uninstall -g generator-hyperledger-composer
```

```shell
cd ~/fabric-dev-servers
sudo ./stopFabric.sh
sudo ./teardownFabric.sh
```

### node v:8.11.2 ; npm 5.0.0 ; composer 0.19.6
```shell
# https://github.com/hyperledger/composer/releases
nvm install 8.11.2
nvm use 8.11.2
# npm install -g composer-cli
```

## COMPOSER-CLI

### 1) Create a connection.json and modify your package.json with the good name and version

### 2) Clone github repo

```shell
cat ~/.ssh/id_rsa.pub

git clone git@github.com:maxgfr/blockchain-container
```

### 3) Run :

```shell
composer card create -p connection.json -u PeerAdmin -c ~/fabric-dev-servers/fabric-scripts/hlfv11/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem -k ~/fabric-dev-servers/fabric-scripts/hlfv11/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/114aab0e76bf0c78308f89efc4b8c9423e31568da0c340ca187a9b17aa9a4457_sk -r PeerAdmin -r ChannelAdmin

composer card import -f PeerAdmin@magma-network.card

cd blockchain-container/dist/

composer network install -c PeerAdmin@magma-network -a magma.bna

composer network start --networkName magma-network --networkVersion 1.0.0 -A admin -S adminpw -c PeerAdmin@magma-network

composer card import -f admin@magma-network.card

composer network ping -c admin@magma-network
```

## REST SERVER


### To run in background :

```shell
export COMPOSER_CARD=admin@magma-network
export COMPOSER_NAMESPACES=always
export COMPOSER_AUTHENTICATION=false
export COMPOSER_MULTIUSER=false
screen
composer-rest-server
```

### To run in docker container :
```shell
#composer-rest-server --card admin@magma-network

npm install -g loopback-connector-mongodb
```

### Run a mongodb image
```shell
sudo docker run -d --name mongo --network composer_default -p 27017:27017 mongo
```

### Create a dockerfile as below and run

```shell
mkdir toto && cd toto
```

```shell
sudo docker build -t myorg/my-composer-rest-server .
```

### Create a envvars.txt and run
```shell
source envvars.txt
```

### Run the composer-rest-server container :
```shell
sudo docker run \
    -d \
    -e COMPOSER_CARD=${COMPOSER_CARD} \
    -e COMPOSER_NAMESPACES=${COMPOSER_NAMESPACES} \
    -e COMPOSER_AUTHENTICATION=${COMPOSER_AUTHENTICATION} \
    -e COMPOSER_MULTIUSER=${COMPOSER_MULTIUSER} \
    -e COMPOSER_PROVIDERS="${COMPOSER_PROVIDERS}" \
    -e COMPOSER_DATASOURCES="${COMPOSER_DATASOURCES}" \
    -v ~/.composer:/home/composer/.composer \
    --name rest \
    --network composer_default \
    -p 3000:3000 \
    myorg/my-composer-rest-server
```

To check logs :
```shell
sudo docker logs -f rest
```

### If source envvars.txt doesn't work or JSON error :

```shell
#sudo -H vi /etc/environment
chmod -R 777 ~/.composer
```
Create a datasources.json
```shell
export COMPOSER_CARD=admin@magma-network
export COMPOSER_NAMESPACES=always
export COMPOSER_AUTHENTICATION=false
export COMPOSER_MULTIUSER=false
export COMPOSER_DATASOURCES=$(<datasources.json)

sudo docker run \
    -d \
    -e COMPOSER_CARD=${COMPOSER_CARD} \
    -e COMPOSER_NAMESPACES=${COMPOSER_NAMESPACES} \
    -e COMPOSER_AUTHENTICATION=${COMPOSER_AUTHENTICATION} \
    -e COMPOSER_MULTIUSER=${COMPOSER_MULTIUSER} \
    -e COMPOSER_DATASOURCES="${COMPOSER_DATASOURCES}"\
    -e NODE_APP_INSTANCE=""\
    -v ~/.composer:/home/composer/.composer \
    --name rest \
    --network composer_default \
    -p 3000:3000 \
    myorg/my-composer-rest-server
```
