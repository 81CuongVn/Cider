const MusicKitTools = {
    async v3Continuous ({
        href, 
        options = {}, 
        reqOptions = {},
        onProgress = () => {},
        onError = () => {},
        onSuccess = () => {}
    } = {}) {
        let returnData = []
        async function sendReq(href, options) {
            const response = await app.mk.api.music(href, options).catch(error => onError)
            
            returnData = returnData.concat(response.data.data)
            if(response.data.next) {
                onProgress({
                    response: response,
                    total: returnData.length
                })
                try {
                    await sendReq(response.data.next, options)
                }catch(e){ 
                    await sendReq(response.data.next, options)
                }
            }
        }
        
        await sendReq(href, options)
        onSuccess(returnData)
        return returnData
    },
    getHeader() {
        return new Headers({
            Authorization: 'Bearer ' + MusicKit.getInstance().developerToken,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Music-User-Token': '' + MusicKit.getInstance().musicUserToken
        });
    }
}

export { MusicKitTools }