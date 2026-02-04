export const CLOUD_CONFIG = {
    google: {
        clientId: "4648765808-r67fi397g4sqo5v3fkjif3il7u0njkub.apps.googleusercontent.com",
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
