# Cider i18n Notices & Changelog

Some notes about Cider's i18n support.

- Localization files are stored in jsonc format aka "JSON with Comments"
- The default language is English.
- The default language is used for messages that are not translated.
- Try when possible to keep the messages the similar in length to the English ones.
- Most of the strings in the content area are provided and translated by Apple themselves, and do not need to be translated.
- The language Apple Music uses are dependent on the storefront region.

# Multiple Plural Forms

Multiple plural forms can be supported as below: 

The keys and its meanings are here : https://github.com/prantlf/fast-plural-rules/blob/master/docs/languages.md#supported-languages

For example , English is in Plural rule #1 and has 2 keys ```one``` and ```other```

Russian is in Plural rule #7 (3 forms) : ```one```, ```few``` and ```other```

How it is implemented for English:

```
 "term.track": {
    "one" : "track",
    "other" : "tracks"
  },
```



## Localization Notices

Several changes have been made to configuration options and will be listed below with the relevant locales that have
been modified, the ones not mentioned in the list need modifying.

* `settings.option.experimental.closeButtonBehaviour`: Changed to `close_button_hide` - Should be "Close Button Should Hide the Application". `.quit`, `.minimizeTaskbar` and `.minimizeTray` have been removed. Translations done for en_US.
* `action.update`: Added for `en_US`.
* `term.topResult`: "Top Result" - Added for `en_US`.
* `term.sharedPlaylists`: "Shared Playlists" - Added for `en_US`.
* `term.people`: "People" - Added for `en_US`.

Update 02/02/2022 17:16 UTC

* `term.newpreset.name`: Added for `en_US`.
* `term.addedpreset`: Added for `en_US`.
* `term.deletepreset.warn`: Added for `en_US`.
* `term.deletedpreset`: Added for `en_US`.
* `term.musicVideos`: Added for `en_US`.
* `term.stations`: Added for `en_US`.
* `term.curators`: Added for `en_US`.
* `term.appleCurators`: Added for `en_US`.
* `term.radioShows`: Added for `en_US`.
* `term.recordLabels`: Added for `en_US`.
* `term.videoExtras`: Added for `en_US`.
* `term.top`: Added for `en_US`.
* `action.newpreset`: Added for `en_US`.
* `action.deletepreset`: Added for `en_US`.

Update 04/02/2022 10:00 UTC

* `term.history`: Added for `en_US`.
* `action.copy`: Added for `en_US`.
* `settings.header.visual.theme`: Added for `en_US`.
* `settings.option.visual.theme.default`: Added for `en_US`.
* `settings.option.visual.theme.dark`: Added for `en_US`.
* `settings.option.experimental.copy_log`: Added for `en_US`.
* `settings.option.experimental.inline_playlists`: Added for `en_US`.

Update 05/02/2022 09:00 UTC

* `settings.header.audio.quality.hireslossless`: Added for `en_US`.
* `settings.header.audio.quality.hireslossless.description`: Added for `en_US`.
* `settings.header.audio.quality.lossless`: Added for `en_US`.
* `settings.header.audio.quality.lossless.description`: Added for `en_US`.
* `settings.option.audio.enableAdvancedFunctionality.ciderPPE`: Added for `en_US`.
* `settings.option.audio.enableAdvancedFunctionality.ciderPPE.description`: Added for `en_US`.

Update 06/02/2022 10:35 UTC

* `settings.header.audio.quality.hireslossless.description`: Brackets removed, handled in renderer.
* `settings.header.audio.quality.lossless.description`: Brackets removed, handled in renderer.
* `settings.header.audio.quality.high.description`: Added for `en_US`.
* `settings.header.audio.quality.auto`: Removed as default for MusicKit is 256.
* `settings.header.audio.quality.standard`: Replaced `settings.header.audio.quality.low` to match MusicKit naming.
* `settings.header.audio.quality.standard.description`: Added for `en_US`.

Update 08/02/2022 10:20 UTC

* `settings.option.general.updateCider`: Added for `en_US`.
* `settings.option.general.updateCider.branch`: Added for `en_US`.
* `settings.option.general.updateCider.branch.description`: Added for `en_US`.
* `settings.option.general.updateCider.branch.main`: Added for `en_US`.
* `settings.option.general.updateCider.branch.develop`: Added for `en_US`.
* `settings.option.audio.enableAdvancedFunctionality.ciderPPEStrength`: Added for `en_US`.
* `settings.option.audio.enableAdvancedFunctionality.ciderPPEStrength.description`: Added for `en_US`.
* `settings.option.audio.enableAdvancedFunctionality.ciderPPEStrength.standard`: Added for `en_US`.
* `settings.option.audio.enableAdvancedFunctionality.ciderPPEStrength.aggressive`: Added for `en_US`.
* `settings.warn.audio.enableAdvancedFunctionality.ciderPPE.compatibility`: Added for `en_US`.
* `settings.warn.audio.enableAdvancedFunctionality.audioSpatialization.compatibility`: Added for `en_US`.
* `term.requestError`: Added for `en_US`.
* `term.song.link.generate`: Added for `en_US`.

Update 10/02/2022 05:58 UTC

* `term.sortBy.dateAdded`: Added for `en_US`.

Update 12/02/2022 12:00 UTC

* Added support for multiple plural forms. [Details](#multiple-plural-forms)
* `term.version`: Added for `en_US`.
* `settings.option.visual.theme.github.download`: Added for `en_US`.
* `settings.prompt.visual.theme.github.URL`: Added for `en_US`.
* `settings.notyf.visual.theme.install.success`: Added for `en_US`.
* `settings.notyf.visual.theme.install.error`: Added for `en_US`.
* `term.defaultPresets`: Added for `en_US`.
* `term.userPresets`: Added for `en_US`.

Update 16/02/2022 21:45 UTC

* `term.audioControls`: Added for `en_US`.
* `settings.option.audio.volumeStep`: Added for `en_US`.
* `settings.option.audio.maxVolume`: Added for `en_US`.`

Update 17/02/2022 10:00 UTC

+ `settings.header.debug`: Added for `en_US`.
+ `settings.option.debug.copy_log`: Replaces `settings.option.experimental.copy_log`.
+ `settings.option.debug.openAppData`: Added for `en_US`
+ `action.open`: Added for `en_US`

Update 19/2/2022 21:00 UTC

* `term.noVideos`: Added for `en_US`
* `term.plugin`: Added for `en_US`
* `term.pluginMenu`: Added for `en_US`
* `term.replay`: Added for `en_US`
* `term.uniqueAlbums`: Added for `en_US`
* `term.uniqueArtists`: Added for `en_US`
* `term.uniqueSongs`: Added for `en_US`
* `term.topArtists`: Added for `en_US`
* `term.listenedTo`: Added for `en_US`
* `term.times`: Added for `en_US`
* `term.topAlbums`: Added for `en_US`
* `term.plays`: Added for `en_US`
* `term.topGenres`: Added for `en_US`
* `action.install`: Added for `en_US`
* `settings.option.general.resumebehavior`: Added for `en_US`
* `settings.option.general.resumebehavior.description`: Added for `en_US`
* `settings.option.general.resumebehavior.locally`: Added for `en_US`
* `settings.option.general.resumebehavior.locally.description`: Added for `en_US`
* `settings.option.general.resumebehavior.history`: Added for `en_US`
* `settings.option.general.resumebehavior.history.description`: Added for `en_US`
* `settings.option.audio.audioLab`: Added for `en_US`
* `settings.option.audio.audioLab.description`: Added for `en_US`
* `settings.warn.audioLab.withoutAF`: Added for `en_US`
* `settings.option.audio.enableAdvancedFunctionality.analogWarmth`: Added for `en_US`
* `settings.option.audio.enableAdvancedFunctionality.analogWarmth.description`: Added for `en_US`
* `settings.option.audio.enableAdvancedFunctionality.analogWarmthIntensity`: Added for `en_US`
* `settings.option.audio.enableAdvancedFunctionality.analogWarmthIntensity.description`: Added for `en_US`
* `settings.option.audio.enableAdvancedFunctionality.analogWarmthIntensity.smooth`: Added for `en_US`
* `settings.option.audio.enableAdvancedFunctionality.analogWarmthIntensity.warm`: Added for `en_US`
* `settings.option.audio.enableAdvancedFunctionality.tunedAudioSpatialization`: Added for `en_US`
* `settings.option.audio.enableAdvancedFunctionality.tunedAudioSpatialization.description`: Added for `en_US`
* `settings.option.audio.enableAdvancedFunctionality.tunedAudioSpatialization.profile`: Added for `en_US`
* `settings.option.audio.enableAdvancedFunctionality.tunedAudioSpatialization.profile.description`: Added for `en_US`
* `settings.option.audio.enableAdvancedFunctionality.tunedAudioSpatialization.profile.standard`: Added for `en_US`
* `settings.option.audio.enableAdvancedFunctionality.tunedAudioSpatialization.profile.audiophile`: Added for `en_US`
* `settings.header.visual.theme.github.page`: Added for `en_US`
* `settings.option.visual.theme.github.explore`: Added for `en_US`
* `settings.option.visual.theme.github.install.confirm`: Added for `en_US`
* `settings.option.experimental.unknownPlugin`: Added for `en_US`
* `settings.option.experimental.unknownPlugin.description`: Added for `en_US`

Update 25/02/2022 15:30 UTC

* `action.moveToTop`: Changed to `Move out of Folder` instead of `Move to top`

Update 27/02/2022 18:30 UTC

* `settings.notyf.updateCider.update-not-available`: Added for `en_US`
* `settings.notyf.updateCider.update-timeout`: Added for `en_US`
* `settings.notyf.updateCider.update-downloaded`: Added for `en_US`
* `settings.notyf.updateCider.update-error`: Added for `en_US`

Update 28/02/2022 13:00 UTC

* `term.time.days`: Added for `en_US`
* `term.time.day`: Added for `en_US`

Update 10/3/2022 14:00 UTC
* `settings.header.window`: Added for `en_US`
* `settings.header.window.description`: Added for `en_US`
* `settings.option.window.openOnStartup`: Added for `en_US`
* `settings.option.window.openOnStartup.hidden`: Added for `en_US`

Update 20/3/2022 00:01 UTC
* `term.creditDesignedBy`: Added for `en_US`

Update 29/3/2022 04:00 UTC
* `settings.option.audio.enableAdvancedFunctionality.ciderPPE.description`: Changed for `en_US` (Deleted for all language files)