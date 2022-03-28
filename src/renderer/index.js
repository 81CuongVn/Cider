var notyf = new Notyf();

const MusicKitObjects = {
    LibraryPlaylist: function () {
        this.id = ""
        this.type = "library-playlist-folders"
        this.href = ""
        this.attributes = {
            dateAdded: "",
            name: ""
        }
        this.playlists = []
    }
}

// limit an array to a certain number of items
Array.prototype.limit = function (n) {
    return this.slice(0, n);
};

Vue.component('animated-number', {

    template: "<div style='display: inline-block;'>{{ displayNumber }}</div>",
    props: { 'number': { default: 0 } },

    data() {
        return {
            displayNumber: 0,
            interval: false
        }
    },

    ready() {
        this.displayNumber = this.number ? this.number : 0;
    },

    watch: {
        number() {
            clearInterval(this.interval);

            if (this.number == this.displayNumber) {
                return;
            }

            this.interval = window.setInterval(() => {
                if (this.displayNumber != this.number) {
                    var change = (this.number - this.displayNumber) / 10;
                    change = change >= 0 ? Math.ceil(change) : Math.floor(change);
                    this.displayNumber = this.displayNumber + change;
                }
            }, 20);
        }
    }
})

Vue.component('sidebar-library-item', {
    template: '#sidebar-library-item',
    props: {
        name: {
            type: String,
            required: true
        },
        page: {
            type: String,
            required: true
        },
        svgIcon: {
            type: String,
            required: false,
            default: ''
        },
        cdClick: {
            type: Function,
            required: false
        }
    },
    data: function () {
        return {
            app: app,
            svgIconData: ""
        }
    },
    async mounted() {
        if (this.svgIcon) {
            this.svgIconData = await this.app.getSvgIcon(this.svgIcon)
        }
    },
    methods: {}
});

function fallbackinitMusicKit() {
    const request = new XMLHttpRequest();

    function loadAlternateKey() {
        let parsedJson = JSON.parse(this.responseText)
        MusicKit.configure({
            developerToken: "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlhXM0w4WVQzUzQifQ.eyJpYXQiOjE2NDU3Njg0MzUsImV4cCI6MTY2MTMyMDQzNSwiaXNzIjoiOFIyM0oyODM1RCJ9.h54gKwfUTR4AOsf_n00a5DKvTfTqbcZJGrxCOvJWFMHhKll-jTb-NqNzMX4Zi0EsCPfFcEueShdsTRE1rJzHzw",
            app: {
                name: 'Apple Music',
                build: '1978.4.1',
                version: "1.0"
            },
            sourceType: 24,
            suppressErrorDialog: true
        })
        setTimeout(() => {
            app.init()
            if(app.cfg.visual.window_background_style == "mica" && !app.isDev) {
                app.spawnMica()
            }
        }, 1000)
    }

    request.addEventListener("load", loadAlternateKey);
    request.open("GET", "https://raw.githubusercontent.com/lujjjh/LitoMusic/main/token.json");
    request.send();
}

document.addEventListener('musickitloaded', function () {
    console.log('MusicKit loaded')
    // MusicKit global is now defined
    function initMusicKit() {
        //let parsedJson = JSON.parse(this.responseText)
        MusicKit.configure({
            developerToken: "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlhXM0w4WVQzUzQifQ.eyJpYXQiOjE2NDU3Njg0MzUsImV4cCI6MTY2MTMyMDQzNSwiaXNzIjoiOFIyM0oyODM1RCJ9.h54gKwfUTR4AOsf_n00a5DKvTfTqbcZJGrxCOvJWFMHhKll-jTb-NqNzMX4Zi0EsCPfFcEueShdsTRE1rJzHzw",
            app: {
                name: 'Apple Music',
                build: '1978.4.1',
                version: "1.0"
            },
            sourceType: 24,
            suppressErrorDialog: true
        }).then(() => {
            function waitForApp() {
                if (typeof app.init !== "undefined") {
                    app.init()
                    if(app.cfg.visual.window_background_style == "mica" && !app.isDev) {
                        app.spawnMica()
                    }
                }
                else {
                    setTimeout(waitForApp, 250);
                }
            }
            waitForApp()
        })
    }


    const request = new XMLHttpRequest();
    request.timeout = 5000;
    request.addEventListener("load", initMusicKit);
    request.onreadystatechange = function (aEvt) {
        if (request.readyState == 4) {
            if (request.status != 200)
                fallbackinitMusicKit()
        }
    };
    request.open("GET", "https://api.cider.sh/v1/");
    request.send();

    // check for widevine failure and reconfigure the instance.
    window.addEventListener("drmUnsupported", function () {
        initMusicKit()
    });
});




if ('serviceWorker' in navigator) {
    // Use the window load event to keep the page load performant
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js?v=1');
    });
}

const getBase64FromUrl = async (url) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result;
            resolve(base64data);
        }
    });
}

function Clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function xmlToJson(xml) {

    // Create the return object
    let obj = {};

    if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                let attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof (obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    console.log(obj);
    return obj;
};

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

var checkIfScrollIsStatic = setInterval(() => {
    try {
        if (position === document.getElementsByClassName('lyric-body')[0].scrollTop) {
            clearInterval(checkIfScrollIsStatic)
            // do something
        }
        position = document.getElementsByClassName('lyric-body')[0].scrollTop
    } catch (e) {
    }

}, 50);

// WebGPU Console Notification
async function webGPU() {
    try {
        const currentGPU = await navigator.gpu.requestAdapter()
        console.log("WebGPU enabled on", currentGPU.name, "with feature ID", currentGPU.features.size)
    } catch (e) {
        console.log("WebGPU disabled / WebGPU initialization failed")
    }
}

function isJson(item) {
    item = typeof item !== "string"
        ? JSON.stringify(item)
        : item;

    try {
        item = JSON.parse(item);
    } catch (e) {
        return false;
    }

    if (typeof item === "object" && item !== null) {
        return true;
    }

    return false;
}

webGPU().then()

let screenWidth = screen.width;
let screenHeight = screen.height;

window.onerror = function (error) {
    console.log(error)
    bootbox.alert("Error occured: " + error)
};
