global.ipcRenderer = require('electron').ipcRenderer;
console.log('Loaded Preload')

let cache = {playParams: {id: 0}, status: null, remainingTime: 0},
	playbackCache = {status: null, time: Date.now()};

const MusicKitInterop = {
	init: function () {
		MusicKit.getInstance().addEventListener(MusicKit.Events.playbackStateDidChange, () => {
			const attributes = MusicKitInterop.getAttributes()
			if (MusicKitInterop.filterTrack(attributes, true, false)) {
				global.ipcRenderer.send('playbackStateDidChange', attributes)
				ipcRenderer.send('wsapi-updatePlaybackState', attributes);
				// if (typeof _plugins != "undefined") {
				//     _plugins.execute("OnPlaybackStateChanged", {Attributes: MusicKitInterop.getAttributes()})
				// }
			}
		});

		/** wsapi */
		MusicKit.getInstance().addEventListener(MusicKit.Events.playbackProgressDidChange, () => {
			ipcRenderer.send('wsapi-updatePlaybackState', MusicKitInterop.getAttributes());
		});
		/** wsapi */

		MusicKit.getInstance().addEventListener(MusicKit.Events.nowPlayingItemDidChange, async () => {
			const attributes = MusicKitInterop.getAttributes()
			const trackFilter = MusicKitInterop.filterTrack(attributes, false, true)

			if (trackFilter) {
				global.ipcRenderer.send('nowPlayingItemDidChange', attributes);
			}

			// LastFM's Custom Call
			await MusicKitInterop.modifyNamesOnLocale();
			if (trackFilter || !app.cfg.lastfm.filterLoop) {
				global.ipcRenderer.send('nowPlayingItemDidChangeLastFM', attributes);
			}
		});

		MusicKit.getInstance().addEventListener(MusicKit.Events.authorizationStatusDidChange, () => {
			global.ipcRenderer.send('authorizationStatusDidChange', MusicKit.getInstance().authorizationStatus)
		})

		MusicKit.getInstance().addEventListener(MusicKit.Events.mediaPlaybackError, (e) => {
			console.warn(`[mediaPlaybackError] ${e}`);
		})
	},
	async modifyNamesOnLocale() {
		if (app.mklang == '' || app.mklang == null) {
			return;
		} 
		const mk = MusicKit.getInstance()
		const nowPlayingItem = mk.nowPlayingItem;
		if ((nowPlayingItem?._songId ?? nowPlayingItem?.songId) == null){
			return;
		} 
		const id = nowPlayingItem?._songId ?? (nowPlayingItem?.songId ?? nowPlayingItem?.id)
		if (id != null && id != -1) {
			try{
			const query = await mk.api.music(`/v1${(((nowPlayingItem?._songId ?? nowPlayingItem?.songId) != null) && ((nowPlayingItem?._songId ?? nowPlayingItem?.songId) != -1)) ? `/catalog/${mk.storefrontId}/` : `/me/library/`}songs/${id}?l=${app.mklang}`);
			if (query?.data?.data[0]){
					let attrs = query?.data?.data[0]?.attributes;
					if (attrs?.name) { nowPlayingItem.attributes.name = attrs?.name ?? ''}
					if (attrs?.albumName) { nowPlayingItem.attributes.albumName = attrs?.albumName ?? ''}
					if (attrs?.artistName) { nowPlayingItem.attributes.artistName = attrs?.artistName ?? ''}

			}} catch (e) { return;}
		} else {return;}
	},
	getAttributes: function () {
		const mk = MusicKit.getInstance()
		const nowPlayingItem = mk.nowPlayingItem;
		const isPlayingExport = mk.isPlaying;
		const remainingTimeExport = mk.currentPlaybackTimeRemaining;
		const attributes = (nowPlayingItem != null ? nowPlayingItem.attributes : {});

		attributes.status = isPlayingExport ?? false;
		attributes.name = attributes?.name ?? 'no-title-found';
		attributes.artwork = attributes?.artwork ?? {url: ''};
		attributes.artwork.url = (attributes?.artwork?.url ?? '').replace(`{f}`, "png");
		attributes.playParams = attributes?.playParams ?? {id: 'no-id-found'};
		attributes.playParams.id = attributes?.playParams?.id ?? 'no-id-found';
		attributes.url = {
			cider: `https://cider.sh/link?play/s/${nowPlayingItem?._songId ?? (nowPlayingItem?.songId ??'no-id-found')}`,
			appleMusic: attributes.websiteUrl ? attributes.websiteUrl : `https://music.apple.com/${mk.storefrontId}/song/${nowPlayingItem?._songId ?? (nowPlayingItem?.songId ??'no-id-found')}`  
		}
		if (attributes.playParams.id === 'no-id-found') {
			attributes.playParams.id = nowPlayingItem?.id ?? 'no-id-found';
		}
		attributes.albumName = attributes?.albumName ?? '';
		attributes.artistName = attributes?.artistName ?? '';
		attributes.genreNames = attributes?.genreNames ?? [];
		attributes.remainingTime = remainingTimeExport
			? remainingTimeExport * 1000
			: 0;
		attributes.durationInMillis = attributes?.durationInMillis ?? 0;
		attributes.startTime = Date.now();
		attributes.endTime = Math.round(
			attributes?.playParams?.id === cache.playParams.id
				? Date.now() + attributes?.remainingTime
				: attributes?.startTime + attributes?.durationInMillis
		);	
		return attributes;
	},

	filterTrack: function (a, playbackCheck, mediaCheck) {
		if (a.name === 'no-title-found' || a.playParams.id === "no-id-found") {
			return;
		} else if (mediaCheck && a.playParams.id === cache.playParams.id) {
			return;
		} else if (playbackCheck && a.status === playbackCache.status) {
			return;
		} else if (playbackCheck && !a.status && a.remainingTime === playbackCache.time) { /* Pretty much have to do this to prevent multiple runs when a song starts playing */
			return;
		}
		cache = a;
		if (playbackCheck) playbackCache = {status: a.status, time: a.remainingTime};
		return true;
	},

	play: () => {
		MusicKit.getInstance().play().then(r => console.log(`[MusicKitInterop.play] ${r}`));
	},

	pause: () => {
		MusicKit.getInstance().pause();
	},

	playPause: () => {
		if (MusicKit.getInstance().isPlaying) {
			MusicKit.getInstance().pause();
		} else if (MusicKit.getInstance().nowPlayingItem != null) {
			MusicKit.getInstance().play().then(r => console.log(`[MusicKitInterop.playPause] Playing ${r}`));
		}
	},

	next: () => {
		try {
			app.prevButtonBackIndicator = false;
		} catch (e) { }
		if (MusicKit.getInstance().queue.nextPlayableItemIndex != -1 && MusicKit.getInstance().queue.nextPlayableItemIndex != null) 
		MusicKit.getInstance().changeToMediaAtIndex(MusicKit.getInstance().queue.nextPlayableItemIndex);
	//	MusicKit.getInstance().skipToNextItem().then(r => console.log(`[MusicKitInterop.next] Skipping to Next ${r}`));
	},

	previous: () => {
		if (MusicKit.getInstance().queue.previousPlayableItemIndex != -1 && MusicKit.getInstance().queue.previousPlayableItemIndex != null) 
		MusicKit.getInstance().changeToMediaAtIndex(MusicKit.getInstance().queue.previousPlayableItemIndex);
	}

}


process.once('loaded', () => {
	console.log("Setting ipcRenderer")
	global.MusicKitInterop = MusicKitInterop;
});
