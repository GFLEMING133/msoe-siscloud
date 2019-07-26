#2019-7-25 1.8.24
 - Fixing/improving finding sisbots on mobile app
 - When switching to hotspot, it should reconnect faster after joining that network
 - Removed duplicate find code from sisbot model, all finding of sisbots handled in manager

#2019-7-15 1.8.23
 - Fixed fonts to be sourced in properly through css.
 - added Show Password to Community sign-in page
 - public / private to display in Community track list as well as private being italisized.
 - changed <meta> tag in dev.index to try and address iPhone Max XS screen sizing issues.
 - changed padding on pause/play button to help with sizing  
#2019-7-10, 1.8.21
 - Fixed merge conflicts and updated code to reflect UI changes from beta releases.
 - WiFi disconnect or power loss no longer bricks table while updating.
 - Pushed to Test Flight and Google Pay and then released into the wild.
 - staging branch was pushed to release.
#2019-7-8, 1.8.18,19
 - Fixed auth_token in fetch2() to be set in proper place.
 - removed debuggers
#2019-7-2,3,4, 1.8.15,16 & 17
 - Pushing Community to Test Flight and Google Play for Company testing. web_uRL has been changed to http://dev.webcenter.sisyphus-industries.com
   in config and for the generated thumbs.
 - corrected scrolling issue in Community Tracks
 - changed sign_in and sign_up to use the fetch2 function for auth-token & header purposes.
#2019-7-1, 1.8.14
 - added <key>NSBluetoothPeripheralUsageDescription</key> to the Sisyphus-Info.plist per error thropwn when    uploading to Test Flight. (iOS ONLY)
#2019-6-27, 1.8.13
 - Updated cordova iOS to 5.0.1
 - Updated Cordova Android to 8.0.0,
 - Updated WifiWizard / polygonproducts to WiFiWizard2 and changed code in siscloud.
 - Updated other plugins and removed those that were depricated.
 - Changed android:usesCleartextTraffic=true in the AndroidManifest to correct launch error of not             connecting to wiFi per Matt K ,
 - Updated gradle to version 5.4.1 . ALl is tested and working for the API level that has been upgraded to 28 per Google Plays notice of necessary upgrade.
#2019-6-18, 1.8.12
 - Updated Android Studio, Cordova, Gradel, and SDK Version/API Level and did test launch.
#2019-6-18, 1.8.11
 - is_network_separate added to fix updating issue and Connect to WiFi
 - merged staging with beta
 - move UI over to webcenter
#2019-6-17, 1.8.10
 - is_network_connected added for table to connect when no internet.
 - Fixed white screen of death by removing fonts.google.api. Sourced font locally.
 - removed background colors for drag and drop (still in testing)
 - Spinner added for when connecting a table to WiFi as to allow time to populate list.
 - Conditionals added for when is_internet_connected or is_network_connected.
 - cleaned up code and commented out functions() not in use.
 - sisbot_url in app.config.js for global variable.

#2019-6-4, 1.8.9
 - Drag and drop again, now with color... Continued testing on multiple devices.
 - Now Playing Footer is now clickable and redirects you to the Home page.
 - Community is going to be available for Beta Testers.
 - Wifi Connect has spinner to wait for available networks to populate array before showing page.
 - Redirect back to app after signing into WiFi.
#2019-5-31, 1.8.8
 - increase the retry timeout on get_wifi network list
  - back out a bad update

#2019-5-02, 1.8.7
 - Changed <meta> to reflect production and for adding media queries to the css.
 - added text-size-adjust to the styles.css to help display transition.
 - added //comments to the server.js, config.js and app.model.sisyphus_manager with code for setting the local dev environment.
 - added conditional in _find_sisbots() to check for the env=beta for setting local dev env and added else if to connect_to_sisbot if beta so it calls the   right url.
 - adjusted height attribute in the home.html for the Disconnect From WIFI page.
 - changed back-arrow routing in the sisyphus-settings-change-name so it doesnt call the change_name() and routes back to the advance settings page.
 - added conditional confirm()'s to check wether the table is_servo or not so it displays different messages for change table name and firmware update.
 - made the Firmware Update page scrollable for phones with smaller screens per customer request.

#2019-04-03, 1.8.6
 - fix problems with track upload

#2019-04-03, 1.8.5
 - Advanced Movement available in Advanced Settings with warning.
 - Fixed drag and scroll down issue on iOS.
 - removed false error warning when uploading .thr tracks.
 - 'SAVE' button added to Night Mode

# 2019-3-21, 1.8.4
  - Deleted alert() from upload tracks as it was throwing when no error

# 2019-03-06, 1.8.4
  - Added alert when uploading wrong file type in Upload Track and added Save button to Night Mode and removed back arrow

# 2019-02-26, 1.8.3
  - After file is uploaded sometimes the ui will show the default Sisyphus Logo image instead of the preview. This is by design. Preview   generation goes into a queue and if            generation is not completed in time the Sisyphus Logo will display instead of the thumbnail.
  - remove several red exclamation points when screen shows something that is expected to happen
  - add spinners during restart

# 2019-02-13, 1.8.2  
  - Fixed Routing issues between playlist and tracks and added a more clear directional path by adding arrows and changing the names of some buttons and click events.
  - Added a "Complete" button and warning when changing the Table Name.
  - Removed "About"  and added "Visit Sisyphus Website".
  - When adding a duplicate track to a playlist it throws an alert with options.
  - Added "Find More Tracks" which leads to the Sisyphus Dropbox of .thr and .svg by other artists.
  - Added Alert when trying to play a track while "Attach" or "Detach" is playing.
  - Fixed Drag and Drop scrolling up & down on Android.
  - Rescan for tables button/capability added.
  - DNS rewrite for white-listing and security upgrades.
  - Does not allow for the track "attach" or "detach" to be interrupted while playing.
  - Upload track for warning now for both .thr and .svg files.
  - Delete in playlists bug fixed
  - Multiple UI changes for UX per Micah
