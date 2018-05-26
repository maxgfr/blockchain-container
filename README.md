# magma

## Hyperledger Composer - Deployment

### Install Composer command

```shell
npm install -g composer-cli
npm install -g composer-rest-server
npm install -g generator-hyperledger-composer
npm install -g yo
npm install -g composer-playground
```
```shell
./downloadFabric.sh
./startFabric.sh
./createPeerAdminCard.sh
```

### If you have a problem, please run :

```shell
npm uninstall -g composer-cli
npm uninstall -g composer-rest-server
npm uninstall -g generator-hyperledger-composer
npm uninstall -g yo
npm uninstall -g composer-playground
```
```shell
cd ~/fabric-dev-servers
./stopFabric.sh
./teardownFabric.sh
```
```shell
composer card delete -c peeradmin@hlfv1
composer card delete -c admin@magma
```
```shell
docker kill $(docker ps -q)
docker rm $(docker ps -aq)
docker rmi $(docker images dev-* -q)
```

### After writing your network run :

```shell
composer archive create --sourceType dir --sourceName . -a ./dist/magma.bna && cd dist

composer network install --card PeerAdmin@hlfv1 --archiveFile magma.bna

composer network start --networkName magma --networkVersion 0.0.X --card PeerAdmin@hlfv1 --networkAdmin admin --networkAdminEnrollSecret adminpw

composer card import --file admin@magma.card

composer network ping --card admin@magma

composer-rest-server --card admin@magma
```

### If you want to upgrade your network :

```shell
#If You have to update the package.json en 0.0.X

composer archive create -t dir -n . && mv magma@0.0.X.bna dist && cd dist

composer network install --archiveFile magma@0.0.X.bna  --card PeerAdmin@hlfv1

composer network upgrade -c PeerAdmin@hlfv1 -n magma -V 0.0.X
```
