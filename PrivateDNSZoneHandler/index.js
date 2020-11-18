const msrest = require("@azure/ms-rest-nodeauth");
const privatedns = require("@azure/arm-privatedns");

const HUB_VNET_NAME = process.env.HUB_VNET_NAME;

module.exports = async function (context, eventGridEvent) {
    // Use Event Grid System Topic to listen on Subscription Events
    context.log("JavaScript Private DNS Zone Linker function processed a request.");

    // Use Azure Function MSI
    msrest.loginWithAppServiceMSI().then((msiTokenRes) => {
        console.log("Retrieved MSI Token Credentials");
        const client = new privatedns.PrivateDnsManagementClient(msiTokenRes, eventGridEvent.data.subscriptionId);
        const resourceGroupName = eventGridEvent.subject.split('/')[4];
        const privateZoneName = eventGridEvent.subject.split('/')[8];

        // Choose a random number to append to the VNet Link Name
        const vnetLinkName = eventGridEvent.subject.split('/')[8] + "-" + randomSuffix();

        const vnetLink = {
            location: "Global",
            virtualNetwork: {
                id: HUB_VNET_NAME
            },
            registrationEnabled: false
          };

        // Attach the private DNS zone retrieved in the event to the Hub VNet
        console.log("Attempting to link privateZone: " + privateZoneName + " in rg: " + resourceGroupName + " and name it: " + vnetLinkName);

        client.virtualNetworkLinks.createOrUpdate(resourceGroupName, privateZoneName, vnetLinkName, vnetLink).then((result) => {
            console.log("Linker Function Succeeded!");
            console.log(result.id);
        }).catch((err) => {
            console.log(err);
        });

      }).catch((err) => {
        console.log(err);
      });
};

const randomSuffix = function () {
    return Math.floor(Math.random() * 1000);
};