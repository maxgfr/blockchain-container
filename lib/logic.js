/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * A position reading has been received for a shipment
 * @param {org.magma.max.PositionReading} positionReading - the PositionReading transaction
 * @transaction
 */
async function positionReading(positionReading) {

    const shipment = positionReading.shipment;

    let lat1 = positionReading.latitude;
    let lng1 = positionReading.longitude;

    console.log('Adding latitude ' + positionReading.latitude + ' and longitude ' + positionReading.longitude +' to shipment ' + shipment.$identifier + ' at' + positionReading.timestamp);

    if (shipment.positionReadings) {
        shipment.positionReadings.push(positionReading);
    } else {
        shipment.positionReadings = [positionReading];
    }

    let results = await query('selectSites'); // get All Site

    for (let n = 0; n < results.length; n++) {
        let site = results[n];

        let geofenc_site = site.geofence;
        let lat2 = site.latitude;
        let lng2 = site.longitude;

        let rlo1 = ( lng1 * Math.PI ) % 180;
        let rla1 = ( lat1 * Math.PI ) % 180;
        let rlo2 = ( lng2 * Math.PI ) % 180;
        let rla2 = ( lat2 * Math.PI ) % 180;
        let dlo = (rlo2 - rlo1) / 2;
        let dla = (rla2 - rla1) / 2;
        let a = Math.sin(dla) * Math.sin(dla) + Math.cos(rla1) * Math.cos(rla2) * Math.sin(dlo) * Math.sin(dlo);
        let distance_metres = (6378137 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));

        if (geofenc_site < distance_metres) {
            // set the status of the shipment
            shipment.status = 'IN_SITE';
            // responsible changing
            shipment.contract.responsible = site.responsible;
        } else {
            // set the status of the shipment
            shipment.status = 'OFF_SITE';
        }

        console.log('Responsible: ' + shipment.contract.responsible.$identifier);
        console.log('Owner: ' + shipment.contract.owner.$identifier);

        // Emit an event for the contract.
        let notif = getFactory().newEvent('org.magma.max', 'hasChanged');
        notif.asset = shipment;
        notif.status = shipment.status;
        notif.date = positionReading.date;
        notif.ts = positionReading.timestamp;
        emit(notif);
    }

    // update the responsible balance
    const responsibleRegistry = await getParticipantRegistry('org.magma.max.Responsible');
    await responsibleRegistry.update(contract.responsible);

    // update the state of the shipment
    const shipmentRegistry = await getAssetRegistry('org.magma.max.Shipment');
    await shipmentRegistry.update(shipment);

}

/**
 * Initialize some test assets and participants useful for running a demo.
 * @param {org.magma.max.SetupDemo} setupDemo - the SetupDemo transaction
 * @transaction
 */
async function setupDemo(setupDemo) {

    const factory = getFactory();
    const NS = 'org.magma.max';

    // create the owner
    const owner = factory.newResource(NS, 'Owner', 'owner@email.com');
    const ownerAddress = factory.newConcept(NS, 'Address');
    ownerAddress.country = 'France';
    owner.address = ownerAddress;

    // create the responsible
    const responsible = factory.newResource(NS, 'Responsible', 'responsible@email.com');
    const responsibleAddress = factory.newConcept(NS, 'Address');
    responsibleAddress.country = 'UK';
    responsible.address = responsibleAddress;

    // create the site
    const site = factory.newResource(NS, 'Site', 'site@email.com');
    const siteAddress = factory.newConcept(NS, 'Address');
    siteAddress.country = 'Marseille';
    site.address = siteAddress;
    site.longitude = 0;
    site.latitude = 0;
    site.geofence = 0;
    site.type = 'FACTORY';
    site.responsible = factory.newRelationship(NS, 'Responsible', 'responsible@email.com');

    // create the contract
    const contract = factory.newResource(NS, 'Contract', 'CON_001');
    contract.owner = factory.newRelationship(NS, 'Owner', 'owner@email.com');
    contract.responsible = factory.newRelationship(NS, 'Responsible', 'responsible@email.com');
    contract.site = factory.newRelationship(NS, 'Site', 'site@email.com');

    // create the shipment
    const shipment = factory.newResource(NS, 'Shipment', 'SHIP_001');
    shipment.status = 'IN_SITE';
    shipment.contract = factory.newRelationship(NS, 'Contract', 'CON_001');

    // add the owners
    const ownerRegistry = await getParticipantRegistry(NS + '.Owner');
    await ownerRegistry.addAll([owner]);

    // add the responsibles
    const responsibleRegistry = await getParticipantRegistry(NS + '.Responsible');
    await responsibleRegistry.addAll([responsible]);

    // add the sites
    const siteRegistry = await getParticipantRegistry(NS + '.Site');
    await siteRegistry.addAll([site]);

    // add the contracts
    const contractRegistry = await getAssetRegistry(NS + '.Contract');
    await contractRegistry.addAll([contract]);

    // add the shipments
    const shipmentRegistry = await getAssetRegistry(NS + '.Shipment');
    await shipmentRegistry.addAll([shipment]);
}
