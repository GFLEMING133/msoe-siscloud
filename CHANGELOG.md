#2019-10-17 1.8.66
 - infinite scrolling added to Community and All Tracks
 - sign_out_community() added to community.js / and sisyphus-community-tracks-tmp
 - 5 tap sets sisbot_registration to 'find' after setting env to alpha for auto launch.
 - added word break to all model.data.name to adjust for long track naming"
 - cleaned up unused js models
 - rounded img_corners
 - env=alpha api_url & web_url now point to dev.webcenter for Apple testers
 - conditional added for showing Sign Out in community
 - list-image fallback added for Alphha environment ands when img does not render.
#2019-10-17 1.8.65
 - lazy loading added to All Tracks page
 - media queries added for bottom pagination bar
 - Android SDK bumped up to 29 for Android 10 support (fixes app compatibility in Google Play when downloading app)
 - community model.limit set to 30 (was 40)
 - <br/> fixes
 -  beautified files 
#2019-10-17 1.8.64 
 - Added Pagination to community tracks
 - Added lazy loading for images and pagination to speed up on-loading.
 - Multiple download with checkboxes added to Community
 - Overlay added when downloading tracks in community.
 - SortBy bar is now FlexBoxed and track name area is now set at a fixed with with word-break
 - Android was updated to sdk 29 for phones running Android Version 10
 - iOS set NSBluetoothPeripheralUsageDescription and NSBluetoothAlwaysUsageDescription <key></key> in the info.plist
 - Added add android:usesCleartextTraffic="true" to the AndroidManifest.xml  (more in the notes.)
 - Updated cordova plugins.
 - SIRI Shortcuts added
#2019-10-2 1.8.62 & 63
 - Added multiple download to community and add to playlist. 
 - Added community model
 - reworked download_wc()
 - Sort by download_count (Most Popular) added. 
 - Spinner added to fetching community tracks
#2019-10-2 1.8.60
 - Added conditional for _processing_registration() to fix re-sign-up error.
 - Spinner added when downloading tracks in Community.
 - Error handling for email and username in Community updated.
 - Adjusted thumbnail generation timeout to 9000
 - Changed stroke_width to 7 in gen_thumbnails.js and model.track
#2019-09-25 1.8.58
 - Color Picker Input field, 
 - Primary/Secondary Buttons incorporate white value
#2019-09-24 1.8.57
 - Alert "Track Added to Library" removed.
 - Save after White slider change
 - Save after led offset change
 - Disable Jimmy & Homing offset for servo
 - Disable auto-brightness in onboarding page
 - Log files page loads list from sisbot
 - Paint pattern added
 - Color picker bugfixes
 - Color picker input field
 - Primary/Secondary buttons incorporate white value
#2019-09-19 1.8.54
 - CSON selection in Advanced Table Settings
 - Homing Offset in Advanced Table Settings
 - Save Advanced Table Settings beforcd installing Python from button
 - CSON RGBW Offset
 - Back button fix from Adding Custom Tracks
#2019-09-12 1.8.50 & 51
 - Added Add to playlist to the Community when downloading tracks.
 - Moved sing_in /sign_up functionality to model.session
 - Added eye icons to show password instead of wording and checkbox.
 - Remember now stores email and password to session and auto log_in when coming back to Coommunity after closing app.
 - Removed back arrow from Track Search and Night Mode
#2019-09-12 1.8.49
 - Install Python added to Advanced Table Settings
 - Demo pattern added to Advanced Lights Settings
 - Warm white balance adjustment
 - Auto -resume previous pattern after leaving calibrate lights page.
 - Back button added back to Night Mode page
 - Padding-bottom added to fix cut off screens on iPhone.
 - Table Settings tab is now hidden unitl 7 tap is applied.
#2019-09-06 1.8.48
 - Reworked  scrollDown media queries using max-height: calc()
 - Removed max-height from .web .app {} in css per Matt
 - Removed white from the app.data.js, primary & secondary-color-tmp have new on-click to publish instead of canceling data.
 - Added data-rangetype='true' in the <input> sliding bar in the settings for brightness.
#2019-09-04 1.8.45
 - Merged staging into beta
 - Fixed scrolling issues with Community pages
 - pushing for Beta testers
 #2019-9-4 1.8.45
 - Reverted birghtness_min /will be fixed on back end.
 - Changed Target Version in Xcode to address dissapearing dropdown issue.
 - Changed default Device Orientation in the pList file to have only Portrait available for app.
#2019-9-3 1.8.43 & 44
 - Added exclamation triangle back to No Table FOund page for Apples internal testing
 - Fixed brightness_min value in <input> and in the brightness_min() to .10 to fix off set.
 - Night Mode now showing the save button with Enable Night Mode box unchecked for bug fix.
 - Commented out Community (again)
 - this is being pushed to Production.
#2019-09-01 1.8.41
 - Spread and Rho Fade Primary and Secondary pages styled and flex-justify-aligned
 - Added styling
 - Fixed community-hero from cloud overflowing outside of app on local-host
 - Regression testing pages updated
#2019-08-29 1.8.36-40
 - RGBW Lights added to UI
 - Webcenter added to UI
 - CSON override added to UI
#2019-8-15 1.8.34 & 35
 - Regression Testing staging branch with previous changes.
 - Sisbot updates included in regression testing.
 - removed pull-top from Community header to address white gap on Android
 - added new splash screen for ios to address default cordova photo showing. new png is 1125x2436
 - community is "//commented out" in this release.
#2019-8-15 1.8.32 & 33
 - Community UI changes and re-configuring of pages to flow seemlessly with iPhone gap and notch
 - Added scrolling to all pages in Community.
 - Cleaned up media queries and classes
 - Changed all alert()'s to app.plugins.n.alert() and added custom Headers to some. EXCEPT alert()'s used for debugging
#2019-8-12 1.8.30 & 31
 - Onboarding Wifi list spinner and dropdown fix
 - Updated Sortable.js to address passiveEventListener issues.
 - iPhone media query for footer added back  
 - Decreased timeout in ping_sisbots() for Android connect and commented put conditionals,
 - _find_sisbots() changed order of switch case for finding bots first

#2019-8-7 1.8.29
 - Changed timeout in ping_sisbot() to spped up Android connect when searching for tables.
 - Commented out old conditionals in the ping_sisbot()
 - In the _find_sisbots() changed order of swtch(num_check) case 1 through 4 to show bots first per Micahs request.
 - removed Media Queries to address pushed up footer on iPhones.
#2019-7-29 1.8.28
 - Onboarding Wifi list spinner and dropdown fix
 - merged staging with beta to push beta to TestFlight and Google Play to test all changes --WiFi, WiFi error handeling, ui changes and font replacement.
 - Prioritize known/network bots over bots in hotspot mode when finding sisbots

#2019-7-27 1.8.27
 - Fix (remove) jump back to home page on reconnect
 - Fix wifi reconnect issues on bad password
 - Fix Wifi network list reselecting first entry

#2019-7-25 1.8.24
 - Fixing/improving finding sisbots on mobile app
 - When switching to hotspot, it should reconnect faster after joining that network
 - Removed duplicate find code from sisbot model, all finding of sisbots handled in manager

 #2019-7-15 1.8.24,25
 - iPhone MAX, X, XS have targeted media queries.
 - App is now displaying correctly on iPhone X/XS/MAX with notch and microphone.
 - sisyphus-playlists-active-tmp. "Play" and Shuffle" div is position:fixed, moved out of .scroll <div></div> and media-queried iPhones to have no margin-top.     (NEEDS TESTING ON MULTIPLE PHONES!!)
 - Error handeling for wifi login in sisyphus-settings-wifi-tmp. Now handles 8 or less characters, Wrong SSID info and No Password w/alert that is changing to a   confirm.
 - fontawesome updated. fa became far or fas and added some newer looking icons.

#2019-7-15 1.8.23
 - Fixed fonts to be sourced in properly through css.
 - added Show Password to Community sign-in page
 - public / private to display in Community track list as well as private being italicized.
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
