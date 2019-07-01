var config = {
    version : '1.8.13', //Updated cordova iOS to 5.0.1, cordova Android to 8.0.0, updated WifiWizard / polygonproducts to WiFiWizard2 and changed code in siscloud. Updated other plugins and removed those that were deprocated. Changed android:usesCleartextTraffic=true in the AndroidManifest to correct launch error of not connecting to wiFi per Matt K , Updated gradle to version 5.4.1 . ALl is tested and working for the API level that has been upgraded to 28 per Google Plays notice of necessary upgrade. 
    debug   : true,
    env     : process.env.NODE_ENV,
    matt_dev: {
      base_dir	: '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			: 3001,
      base_url  : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
