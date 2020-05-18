/**
 * @param   {File}  file
 * @return  {Promise<string>}
 */
export function fileToDataURI(file) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = function () {
                resolve(reader.result);
            };
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * @param {string} dataURI
 * @return {File}
 */
export function dataURItoFile(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    let byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(dataURI.split(',')[1]);
    } else {
        byteString = unescape(dataURI.split(',')[1]);
    }

    // separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new File([ia], 'logo.' + mimeString.split('/')[1], {
        type: mimeString,
    });
}
