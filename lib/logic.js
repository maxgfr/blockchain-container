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
 * A position reading has been received for a container
 * @param {org.magma.max.PositionReading} positionReading - the PositionReading transaction
 * @transaction
 */
async function positionReading(positionReading) {

    const container = positionReading.container;

    let lat1 = positionReading.latitude;
    let lng1 = positionReading.longitude;

    console.log('Adding latitude ' + positionReading.latitude + ' and longitude ' + positionReading.longitude +' to container ' + container.$identifier + ' at' + positionReading.timestamp);

    console.log('Owner: ' + container.owner.$identifier);

    if (container.positionReadings) {
        container.positionReadings.push(positionReading);
    } else {
        container.positionReadings = [positionReading];
    }

    let results = await query('selectSites'); // get All Site

    for (let n = 0; n < results.length; n++) {
        let site = results[n];

        console.log("Site: " + site);

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

        if (distance_metres <= geofenc_site) {
            // set the status of the container
            if (container.status) {
                container.status.push('IN_SITE');
            } else {
                container.status = ['IN_SITE'];
            }
            // site changing
            if (container.site) {
                container.site.push(site);
            } else {
                container.site = [site];
            }
            // site responsible
            if (container.idresponsible) {
                container.idresponsible.push(site.business.id);
            } else {
                container.idresponsible = [site.business.id];
            }
        } else {
            // set the status of the container
            if (container.status) {
                container.status.push('OFF_SITE');
            } else {
                container.status = ['OFF_SITE'];
            }
        }
    }

    // Emit an event
    let notif = getFactory().newEvent('org.magma.max', 'hasChanged');
    notif.container = container;
    notif.status = container.status;
    notif.date = positionReading.date;
    notif.ts = positionReading.timestamp;
    emit(notif);

    // update the site
    const siteRegistry = await getParticipantRegistry('org.magma.max.Site');
    await siteRegistry.update(container.site);

    // update the container
    const containerRegistry = await getAssetRegistry('org.magma.max.Container');
    await containerRegistry.update(container);

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
    siteAddress.country = 'Clermont-Ferrand';
    site.address = siteAddress;
    site.longitude = 3.0862800;
    site.latitude = 45.7796600;
    site.geofence = 100;
    site.type = 'FACTORY';
    site.business = factory.newRelationship(NS, 'Responsible', 'business@email.com');

    // create the container
    const container = factory.newResource(NS, 'Container', 'CONT_001');
    container.status = ['IN_SITE'];
    container.owner = factory.newRelationship(NS, 'Owner', 'owner@email.com');
    container.site = factory.newRelationship(NS, 'Site', 'site@email.com');

    // add the owners
    const ownerRegistry = await getParticipantRegistry(NS + '.Owner');
    await ownerRegistry.addAll([owner]);

    // add the responsibles
    const responsibleRegistry = await getParticipantRegistry(NS + '.Responsible');
    await responsibleRegistry.addAll([responsible]);

    // add the sites
    const siteRegistry = await getParticipantRegistry(NS + '.Site');
    await siteRegistry.addAll([site]);

    // add the containers
    const containerRegistry = await getAssetRegistry(NS + '.Container');
    await containerRegistry.addAll([container]);
}
