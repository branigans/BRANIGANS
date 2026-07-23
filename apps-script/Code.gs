// Branigans — backend del formulario de registro y del panel admin.
//
// Despliegue (Google Apps Script, vinculado a la hoja de cálculo de destino):
//   1. Extensiones > Apps Script en tu Google Sheet, pega este archivo como Code.gs.
//   2. Configuración del proyecto > Propiedades del script, agrega:
//        NOTION_TOKEN  = tu secreto de integración de Notion
//        NOTION_DB     = el ID de la base de datos de Notion
//        ADMIN_PASS    = la contraseña del panel admin
//   3. Implementar > Nueva implementación > Aplicación web.
//        Ejecutar como: Yo
//        Quién tiene acceso: Cualquier usuario
//   4. Copia la URL de la implementación a BACKEND_URL en index.html.
//
// Ninguno de estos valores vive en el HTML público: solo aquí, como
// propiedades del script, fuera del alcance del navegador.

function doGet(e) {
  if (e.parameter.action === 'list') {
    return json(handleList(e.parameter.pass));
  }
  return json({ ok: false, error: 'unknown action' });
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents || '{}');
  if (data.action === 'auth') {
    return json({ ok: checkPass(data.pass) });
  }
  return json(handleSubmit(data));
}

function checkPass(pass) {
  var real = PropertiesService.getScriptProperties().getProperty('ADMIN_PASS');
  return !!real && pass === real;
}

function handleList(pass) {
  if (!checkPass(pass)) return { ok: false, error: 'unauthorized' };
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var rows = sheet.getDataRange().getValues();
  rows.shift(); // encabezado
  var clients = rows
    .filter(function (r) { return r[0]; })
    .map(function (r) {
      return { nombre: r[0], cel: String(r[1]), email: r[2], fecha: r[3] };
    });
  return { ok: true, clients: clients };
}

function handleSubmit(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([data.nombre, data.cel, data.correo, data.fecha]);
  var notionOk = sendToNotion(data);
  return { ok: true, notion: notionOk };
}

function sendToNotion(r) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('NOTION_TOKEN');
  var db = props.getProperty('NOTION_DB');
  if (!token || !db) return false;
  try {
    var res = UrlFetchApp.fetch('https://api.notion.com/v1/pages', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + token,
        'Notion-Version': '2022-06-28'
      },
      payload: JSON.stringify({
        parent: { database_id: db },
        properties: {
          Nombre: { title: [{ text: { content: r.nombre || '' } }] },
          Celular: { rich_text: [{ text: { content: String(r.cel || '') } }] },
          Correo: { rich_text: [{ text: { content: r.correo || '' } }] },
          Fecha: { rich_text: [{ text: { content: r.fecha || '' } }] }
        }
      }),
      muteHttpExceptions: true
    });
    return res.getResponseCode() < 300;
  } catch (err) {
    return false;
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
