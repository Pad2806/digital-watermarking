export const CLOUD_CONFIG = {
    google: {
        clientId: "4648765808-3vai3u5qam5eemv0hcbk5l45b5s51joj.apps.googleusercontent.com",
        developerKey: "AIzaSyCLsKybgjAt6RFuSFe0nJBZiTFHWeQ6JLk",
    },
    dropbox: {
        appKey: "2eslbosdtsy767p",
    }
};

export const hasGoogleKeys = () => {
    return !!CLOUD_CONFIG.google.clientId && !!CLOUD_CONFIG.google.developerKey;
};

export const hasDropboxKeys = () => {
    return !!CLOUD_CONFIG.dropbox.appKey;
};
