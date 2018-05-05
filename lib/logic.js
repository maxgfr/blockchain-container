positionReading/*
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
 * A shipment has been received by an responsible
 * @param {org.magma.max.ShipmentReceived} shipmentReceived - the ShipmentReceived transaction
 * @transaction
 */
async function payOut(shipmentReceived) {

    const contract = shipmentReceived.shipment.contract;
    const shipment = shipmentReceived.shipment;
    console.log('Received at: ' + shipmentReceived.timestamp);
    console.log('Contract arrivalDateTime: ' + contract.arrivalDateTime);

    // set the status of the shipment
    shipment.status = 'ARRIVED';

    //price of the contract by unit container x nbcontainer
    let payOut = contract.unitPrice * shipment.nbcontainer;
    console.log('Payout: ' + payOut);

    contract.responsible.accountBalance += payOut;
    contract.owner.accountBalance -= payOut;

    console.log('Responsible: ' + contract.responsible.$identifier + ' new balance: ' + contract.responsible.accountBalance);
    console.log('Responsible: ' + contract.owner.$identifier + ' new balance: ' + contract.owner.accountBalance);

    // update the responsible balance
    const responsibleRegistry = await getParticipantRegistry('org.magma.max.Responsible');
    await responsibleRegistry.update(contract.responsible);

    // update the responsible's balance
    const ownerRegistry = await getParticipantRegistry('org.magma.max.Owner');
    await ownerRegistry.update(contract.owner);

    // update the state of the shipment
    const shipmentRegistry = await getAssetRegistry('org.magma.max.Shipment');
    await shipmentRegistry.update(shipment);

    // Emit an event for the contract.
    let event = getFactory().newEvent('org.magma.max', 'isReceived');
    event.asset = contract;
    event.arrivalDateTime = shipmentReceived.timestamp;
    emit(event);
}

/**
 * A temperature reading has been received for a shipment
 * @param {org.magma.max.PositionReading} PositionReading - the PositionReading transaction
 * @transaction
 */
async function positionReading(positionReading) {

    const shipment = positionReading.shipment;

    console.log('Adding pos X ' + positionReading.pos_x + ' and pos Y ' + positionReading.pos_y +' to shipment ' + shipment.$identifier);

    if (shipment.positionReadings) {
        shipment.positionReadings.push(positionReading);
    } else {
        shipment.positionReadings = [positionReading];
    }

    // add the temp reading to the shipment
    const shipmentRegistry = await getAssetRegistry('org.magma.max.Shipment');
    await shipmentRegistry.update(shipment);
}

/**
 * Initialize some test assets and participants useful for running a demo.
 * @param {org.magma.max.SetupDemo} setupDemo - the SetupDemo transaction
 * @transaction
 */
async function setupDemo(setupDemo) {  // eslint-disable-line no-unused-vars

    const factory = getFactory();
    const NS = 'org.magma.max';

    // create the owner
    const owner = factory.newResource(NS, 'Owner', 'owner@email.com');
    const ownerAddress = factory.newConcept(NS, 'Address');
    ownerAddress.country = 'USA';
    owner.address = ownerAddress;
    owner.accountBalance = 0;

    // create the responsible
    const responsible = factory.newResource(NS, 'Responsible', 'responsible@email.com');
    const responsibleAddress = factory.newConcept(NS, 'Address');
    responsibleAddress.country = 'UK';
    responsible.address = responsibleAddress;
    responsible.accountBalance = 0;

    // create the site
    const site = factory.newResource(NS, 'Site', 'site@email.com');
    const siteAddress = factory.newConcept(NS, 'Address');
    siteAddress.country = 'Panama';
    site.address = siteAddress;
    site.accountBalance = 0;

    // create the contract
    const contract = factory.newResource(NS, 'Contract', 'CON_001');
    contract.owner = factory.newRelationship(NS, 'Owner', 'owner@email.com');
    contract.responsible = factory.newRelationship(NS, 'Responsible', 'responsible@email.com');
    contract.site = factory.newRelationship(NS, 'Site', 'site@email.com');
    const tomorrow = setupDemo.timestamp;
    tomorrow.setDate(tomorrow.getDate() + 1);
    contract.arrivalDateTime = tomorrow; // the shipment has to arrive tomorrow
    contract.unitPrice = 0.5; // pay 50 cents per unit

    // create the shipment
    const shipment = factory.newResource(NS, 'Shipment', 'SHIP_001');
    shipment.status = 'IN_TRANSIT';
    shipment.unitCount = 5000;
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
