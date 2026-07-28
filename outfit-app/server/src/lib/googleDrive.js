const { google } = require('googleapis');
const { Readable } = require('stream');

let driveClient = null;

function getDrive() {
  if (driveClient) return driveClient;

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no está configurada.');
  }

  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive']
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

async function uploadImage(buffer, mimeType, filename) {
  const drive = getDrive();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID no está configurada.');

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId]
    },
    media: {
      mimeType,
      body: Readable.from(buffer)
    },
    fields: 'id'
  });

  const fileId = res.data.id;

  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' }
  });

  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

module.exports = { uploadImage };
