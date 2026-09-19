const {initializeApp} = require('firebase-admin/app');
const {getStorage} = require('firebase-admin/storage');
const {onDocumentDeleted} = require('firebase-functions/v2/firestore');

initializeApp();

exports.cleanupEventBanner = onDocumentDeleted(
  {
    document: 'eventos/{eventoId}',
    region: 'southamerica-east1',
  },
  async (event) => {
    const flyerPath = event.data?.data()?.flyerPath;
    if (!flyerPath) return;

    await getStorage().bucket().file(flyerPath).delete({ignoreNotFound: true});
  },
);
