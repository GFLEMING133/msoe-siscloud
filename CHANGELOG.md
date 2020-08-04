# 2020-7-2 1.10.29-34

- readjusted counters and set color for Placeholder
- fixed routing after track deletion
- removed sisyphus-community-artist-track-list-item-tmp (no longer needed after search cluster added)
- added conditional for all_track_playlist to stop showing
- fixed Python script error when python crashes
- removed artist comparison conditional to fix tracks not showing
- Pushing changes from 31/32 up for release
- Minor bug fixes

# 2020-7-23 1.9.32

- Added Count to search bars.
- Adjusted tilt for servo tables
- Sending Arrow verts when start_streaming
- Fixed playlist modal to not show Add to All Playlist
- Adjusted Track-Timer
- fixed disconnect from wifi (broke on 1.9.31)

# 2020-7-2 1.10.26-31

- cordova-plugin-screen-orientation added and app.js updated to lock portrait-primary
- Tilt control / Streaming added
- Passcode and HotSpot password merged into one and updated.
- Error alert for upload_tracks in Advance Settings (browser only)
- Updated moment() in Artist created to display correctly
- Rescan for tables added to homepage
- Test mode points to production Webcenter (tap 5x on table not found page)
- cordova-plugin-screen-orientation added and app.js updated to lock portrait-primary
- Time left on current track added

# 2020-7-2 1.10.28
- Pushing to promote new version for Apple because of cordova-plugin causeing socket issues
- In app.config.js alpha is poinitng to 'https://webcenter.sisyphus-industries.com
- Updated cordova wkwebview-engine plugin (iOS only) to fix Community download error

# 2020-6-16 1.10.26

- Force Firmware Update button added to Advanced Table settings
- Downloading Tracks count added to Community overlay
- Cancelling after downloading tracks correctly removes the tracks from the table
- Drawing shows red stop square at correct position of rho 1
- Factory Reset clears the Favorites Playlist model
- Resume time for Pause Between Tracks
- What's New viewable when no Firmware Updates
- Confirmation after changing Passcode password
- All Tracks now has shuffle and play all
- Send white slider value when changing white temp (prevents recentering slider on app startup)
- Fix playback label when playing single track

# 2020-3-10 1.10.09-25 3a89bc1a8f70c2427c7c55e1fdb633f96d745cdf

- Search added to Playlist Edit->Add Tracks
- Searching in All Tracks includes Artist name value
- Editing playlist shows rho start/stop values as it would be played, with connection lines marked
- Error checking for no playlist name
- Community download all bugfixes (sometimes added tracks to next download batch, adding to the playlist created then)
- Zendesk Support requests can be submitted within app
- keyboard dismissal fix with cordova-plugin-wkkeyboardfix pushing for testing
- updated inappbrowser plugin in Cordova for Apple depreciation of UIWebview
- updated app.js for StatusBar.overlaysWebView(false & true) to fix status bar page height for new cordova
- Download All from Artist fixed and routing to modal (also updated in sisbot/)
- UI changes as well as naming conventions.
- Passcode added in app
- Playlist edit modal for name and description
- Versioning in 7 tap updated
- Find More Tracks removed from UI
- Show created_by_name credit on Track lists
- Delay before restarting polling on Reset/Restart/Reboot (and UI without Rescan buttons during that time)
- Delay before restarting polling on Wifi Connect (and UI without Rescan buttons during that time)
- Fixed CSS on Android for homepage playback controls and whole page shift at end of scroll
- Sign Out from Community correctly clears registration data
- Fixed bug where jogging didn't stop on touch release
- Blur input on keyboard enter for a number of inputs
- (Android) Drawing multiply change causes correct redraw
- Passcode requirement fixed when app not refreshed
- Searchable list fix for query length on first load of remote data
- Fix iPad Playlist icon rendering

# 2020-3-12 1.10.08 1d03f3071c64485f403b5ded6412401369d7fa77

- Fetching more artist spinner fix

# 2020-3-4 1.10.00-05 e1da68217ebdb8fa0610bdc797c7eb3e40b28345

- wording and UI changes
- Description error checking
- Community log-in / sign-up error checking updated.
- bug fixes in bind2 (arrays that change without length change)
- Community Playlist pages updated
- scroll_check fixed and moved to searchable model to fix call error.
- Draw inputs changed to populate correct name and save to session.
- Added is_downloaded to  Playlists page
- Community sign in error handling adjusted
- Conditionals added for playlist description
- check_for_unavailable() moved out of conditional in the fetch()
# 2020-3-4 1.9.02 & 03
- Updated info.Plist and added < preference name="WKWebViewOnly" value="true" /> for Xcode depreciation warning (trial)
- Playlist pages updated
# 2020-3-4 1.9.00
- scroll_check fixed and moved to searchable model to fix call error.
- Draw inputs changed to populate correct name and save to session.
- Added is_downloaded to  Playlists page
# 2020-3-2 1.8.99
- UI changes to address responsiveness
- search input now scrolling with page.
#2020-2-27 1.8.98
- add track to playlist routes to playlist after added
- clear listeners on table change
- search added for All Tracks page
- Playlists tab added for all Playlists (including featured)
- Track overlays are all styled the same (pull-bottom close) and scrollable
- Connect to Wifi reconnect timing addressed as well as empty()
- media_queries added
- added trim() to Community sign in error checking
- Whats New notes for Firmware Update
- image fallback fix
- removed drawing preview for alpha
- fixed sign_out_community() to remove unwanted data (private tracks, artists, playlists)
- "In Review" shown on tracks and My Tracks tab added to community
- UI changes
- Connect to sisbot sends data about device to be logged
#2020-2-26 1.8.96 & 97
- test for empty exists() response in staging
#2020-2-8 1.8.93/94
 - Onboarding scrollable
 - Added  "'+self.get('data.name')+' to the notification error.
 - _.omit password from state obj on resp
 - Wifi clearing password fix
 - self._ble_cb fix
 - eye, eye-slash fix
 - scrollIntoView() fix
#2020-2-8 1.8.92
 - BLE, SSID and IP changes.
 - on_init listeners now calling once to address track play
 - SSID Input added to on-boarding and wifi reconnect
 - UI changes
 #2020-2-8 1.8.90
 - BLE scan reverted back to old method (stops scan on first Sisyphus found)
 - Manual SSID entry
 - Manual IP address connect entry
#2020-1-29 1.8.89
 - JSON.parse fix
#2019-01-27 1.8.89-91
 - Playlist now displaying
 - Sisyphus Originals showing all default tracks.
 - Download All tracks working in Community Artist and Playlist
 - Option for manually entering Network Name when connecting to network
 - Hamburger overlay sort and filter working.
 - Artist routing fixed
 - Fetching all tracks reconfigured for community.
 - UI changes.
 - first push of new community to beta
 - Placeholder Rho/RGBW values on Advanced Table Settings removed
 - Track models (Erase, Attach, Detach) marked is_deletable, hides/shows Delete buttons
#2019-01-27 1.8.89
 - Add table name to homepage header
 - Change css on Wifi password visibility toggle
 - "What's Hot" sort option for Community
 - Color Picker allows easier scrolling in app, touch area of circle reduced to just circle
 - Specify IP page added to Change Table page
 - Always Play on Wake added to Night Mode
#2019-12-20 1.8.87, 1.8.88
 - Fixed no-scroll in app
 - Changed is_simulator=false
 - remove scroll and add no-scroll class in draw.js
 - fix app.plugins.json.parse() error
#2019-12-09 1.8.80-86
 - Turned off socket listeners.
 - added OS obj var in sessions to target Android and iOS in css to fix header issue in drawing
 - added Waiting for Wifi spinner on app launch when waiting for wifi to connect back from disconnect
 - added obj var network_status for above issue in the manager and changed conditional in _find_sisbots()
 - styled buttons in Draw and Track Preview
 - removed data-foreach-defaults in the settings-wifi-temp
 - UI changes throughout
 - Added app.is_simulator for development
 - App.log() added for more control over viewing console.log data
 - Remove user data from post.fetch calls. (This caused issues when user model not found, not necessary)
 - Drawing mirroring includes horizontal, vertical, both
 - Change Table page added to Advanced Settings
 - Bluetooth scanning of app scans for all available sisbots (before it always connected to just the first one)
 - Reconnects to lost connection if same Sisbot ID found (on connect to network)
 - Skip network scan on hotspot network (192.168.42.xxx)
 - Skip ping from Bluetooth IP address if not on same network
 - Skip ping when IP address is already in found list
 - Drawing paths make smooth bezier curves
 - Remove steps slider from drawing/upload preview pages
 - Drawing paths export using smooth bezier curves
 - Rescan button forces full rescan
 - Multiple table page spinners/buttons cleaned up
 - Socket won't reconnect while page/app in background, reconnects on moving to foreground
 - Community dl modal is now scrollable.
 - adjusted transition of sortby dropdown
 - Extend timeout for reconnecting to rebooting Pi, to prevent auto-connecting to a different table
 - Browser will refresh after firmware update (making sure user is on most recent cloud code)
 - Track hero page layout change, allows Reversible to be toggled
 - Track hero in Community changed to an overlay
 - Advanced Table Settings includes buttons for re-enabling Servo's when in fault
#2019-11-20 1.8.79
 - Now can add artist name to drawn tracks / auto populates from webcenter (waiting for update to webcenter).
 - Rho Start and finish now working correctly.
 - Redo and Undo added to draw-track-tmp
 - check for m.id when processing sign_in to community.
 - resume playing track after generating preview image
 - list files to upload on track upload page
#2019-11-20 1.8.77-78
 - fixed header issue on android when selecting input fields (height issue and flex conflict)
 - Draw Preview now full height when loading and spinner centered.
 - Multiply default 6 in the Draw page
 - Rho start is @ the 9 o'clock position.
 - Most Popular is now default sort in Community
 - Start & End changed to Sleep and Wake in night-mode and nightlight html
 - Playlist height adjusted for iPhones
#2019-11-20 1.8.76
 - Draw image rendering addressed for web by adding ?moment().format('x') to the end of the url
 - fixed image showing when going back from preview
 - removed media query for body from S10
 - cleaned up css
#2019-11-20 1.8.75
 - rendering issues adjusted
 - restyled sisyphus-draw-track-tmp
#2019-11-20 1.8.74
 - added Drawing to Media
 - fixed white color temp slider on refresh
 - added Cancel Download button to Playlist modal.
#2019-11-13 1.8.73
 - added if(!sisbot) return; to the check_reconnect_status for if no sisbot_id
 - removed /templates from server.js and moved home.html into /tmp to fix routing issues
 - home-tmp.html is now scrollable
 - calling clear_sisbots() and reset_socket() in disconnect_wifi() in model.sisbot to fix reconnect errors and speed up connection
 - cleaned up model objects and unused css attributes
 - calling intake_data(data) in the connect_to_sisbot() instead of setting data as to not reset whole data object.
 - removed conditional for Attempt Reconnect and Reconnect to Sisyphus buttons to always show. and added media query to adjust font for smaller phones.
#2019-11-13 1.8.71 & 72
 - Add Track to New Playlist fix and routing to New Playlist page
 - expanded with of update_1 of progress bar for border issues
 - removed setup_edit() from create_playlist() as it is called in model-run
 - fix add_track_to_playlist() and added data.name to alert instead of "Track"
 - fixed adding tracks to playlist and changed conditional for 'true' to true
 - notification for blank name when adding New Playlist
 - adjusted app scrollDown for white at bottom of edit tracks.
#2019-11-11 1.8.70
 - Fix Current Playing on change
 - added font-awesome mouse for training grounds to the dev.index
 - share_log-files- true for onboarding.
 - bind2 bugs (html of undefined, race conditions, and rendering issues)
 - update is quicker (sisbot repo)

#2019-11-6 1.8.69
 - Fixed Night Mode save issue added conditional for tables without update.
 - added save button for log files.
 - Puppeteer added to project and config.env = training added to the app.config.
 - tg-names added everywhere fro training_grounds
 - Firmware Update now has progress bar
 - added MAC address to Advanced Settings
 - fixed bug in Bind2
 - ui changes for smaller phones /playback controls, buttons, font-size,
 - model:close if error whn downloading tracks from Community
 - added data-run=model.setup_edit for routing to Edit Playlist from Home on app load.
 - Socket reconnect bug fix, should not hammer the table with requests after lost socket/reconnect
 - Onboarding includes opt-in for sharing log files
 - Forgot_password function rewrote to handle errors.
 - restyled errors in Community
 - cleaned up css
 - Removed Sisyphus from the Advanced page in front of id, ip address....
 - Log File opt in added to onboarding.
 - styled upload file button in the Upload Tracks page.
 - Servo Faults in Sisbot 1.10.52+ don't block UI
 - Share Log Files save button appears only when necessary

#2019-10-25 1.8.68
 - data-foreach-limit added to next_tracks and sort_tracks in the sisyphus-current.html for rendering issues
 - Add track circle onclick target range adjusted and centered/ count positioned in center of buttons.
 - padding adjusted for All Tracks
 - Splash screen has no more scrunch
 - database fixed for community downloading issues.
 - Fixed race conditions when when hitting shuffle
 - added media query for Primary and Secondary buttons for iOs 7 and older
 - added media_query for playback-controls to target SE
#2019-10-25 1.8.67
 - Fixed adding tracks to playlist
 - adjusted padding and height for  + and - buttons when adding tracks to playlist for clickability
 - added styling to No Wifi when routing to Community with no WiFi
 - added media_query for font-size and btn-padding for iOS SE
 - fixed Jog buttons in Bind2
 - changed Change Table Name alert to use bind plugin
 - changed Sign Up password length error
 - New Playlist header centered
 - add padding to Factory Reset page for scrolling issues
 - changed timeout in the ping_sisbot to 2500
 - jQuery reference fixed in bind2.js

#2019-10-22 1.8.66
 - infinite scrolling added to Community and All Tracks
 - sign_out_community() added to community.js / and sisyphus-community-tracks-tmp
 - 5 tap sets sisbot_registration to 'find' after setting env to alpha for auto launch.
 - added word break to all model.data.name to adjust for long track naming"
 - cleaned up unused js models
 - rounded img_corners
 - env=alpha api_url & web_url now point to dev.webcenter for Apple testers
 - conditional added for showing Sign Out in community
 - list-image fallback added for Alpha environment ands when img does not render.
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
 - Table Settings tab is now hidden until 7 tap is applied.
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
 - Reverted brightness_min /will be fixed on back end.
 - Changed Target Version in Xcode to address disappearing dropdown issue.
 - Changed default Device Orientation in the pList file to have only Portrait available for app.
#2019-9-3 1.8.43 & 44
 - Added exclamation triangle back to No Table Found page for Apples internal testing
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
 - Community UI changes and re-configuring of pages to flow seamlessly with iPhone gap and notch
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
 - Error handling for wifi login in sisyphus-settings-wifi-tmp. Now handles 8 or less characters, Wrong SSID info and No Password w/alert that is changing to a   confirm.
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
 - Updated other plugins and removed those that were deprecated.
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
 - changed back-arrow routing in the sisyphus-settings-change-name so it doesn't call the change_name() and routes back to the advance settings page.
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
