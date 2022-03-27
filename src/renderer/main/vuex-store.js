const store = new Vuex.Store({
    state: {
        library: {
            // songs: ipcRenderer.sendSync("get-library-songs"),
            // albums: ipcRenderer.sendSync("get-library-albums"),
            // recentlyAdded: ipcRenderer.sendSync("get-library-recentlyAdded"),
            // playlists: ipcRenderer.sendSync("get-library-playlists")
        },
        artwork: {
            playerLCD: ""
        }
    },
    mutations: {
        setLCDArtwork(state, artwork) {
            state.artwork.playerLCD = artwork
        }
    }
})

export {store}