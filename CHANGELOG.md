#2019-6-4, 1.8.9
 - Drag and drop again, now with color... Continued testing on multiple devices.
 - Now Playing Footer is now clickable and redirects you to the Home page. 
 - Community is going to be available for Beta Testers. 
 - Wifi Connect has spinner to wait for available networks to populate array before showing page. 

#2019-5-31, 1.8.8
 - increase the retry timeout on get_wifi network list

#2019-5-02, 1.8.7
 - Changed <meta> to reflect production and for adding media queries to the css.
 - added text-size-adjust to the styles.css to help display transition.
 - added //comments to the server.js, config.js and app.model.sisyphus_manager with code for setting the local dev environment.
 - added conditional in _find_sisbots() to check for the env=beta for setting local dev env and added else if to connect_to_sisbot if beta so it calls the right url.
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
