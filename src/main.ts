// function isCrew(name: string): boolean {
//   const impostorEmoji = "🔪"
//   return name.includes(impostorEmoji) === false
// }

// function isWin(nameCellAddress = "F2"): boolean {
//   const matchLogSheetName = "試合ログ"
//   const matchLogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(matchLogSheetName);
//   if (matchLogSheet === null) {
//     throw new Error(`スプレッドシート「${matchLogSheet}」の取得に失敗しました`);
//   }

//   // const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//   const nameRange = matchLogSheet.getRange(nameCellAddress);
//   const name = nameRange.getValue();
//   console.log(name)

//   const nameIsCrew = isCrew(name)
//   console.log(nameIsCrew)

//   // const matchLogSheetName = "試合ログ"
//   const resultRange = "C2:C"
//   // const matchLogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(matchLogSheetName);
//   const rowNumber = nameRange.getRow();
//   const winnerNameCellInSameRow = matchLogSheet.getRange("C" + rowNumber);
//   const winnerName = winnerNameCellInSameRow.getValue();
//   console.log(winnerName)

//   return name
// }

const outputSheetName = "LINE連携テスト"

const scriptPropertyKeyInfo = { channelAccessToken: "CHANNEL_ACCESS_TOKEN" }

// URLをスプレッドシートに追加する関数
const appendUrlToSheet = (url: string, sheet: GoogleAppsScript.Spreadsheet.Sheet): void => {
  sheet.appendRow([url, new Date()]);
}

// URLがYouTubeのものかをチェックする関数
const isYouTubeUrl = (url: string): boolean => {
  const youTubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;
  return youTubePattern.test(url);
}

// LINEに返信する関数
const replyToLine = (replyToken: string, message: string) => {
  const token = PropertiesService.getScriptProperties().getProperty(scriptPropertyKeyInfo.channelAccessToken);
  Logger.log(token);
  var url = 'https://api.line.me/v2/bot/message/reply';
  var payload = {
    replyToken: replyToken,
    messages: [{
      type: 'text',
      text: message
    }]
  };

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    payload: JSON.stringify(payload)
  };

  UrlFetchApp.fetch(url, options)
}

// メッセージを処理する関数
const processMessage = (messageText: string, sheet: GoogleAppsScript.Spreadsheet.Sheet, replyToken: string): void => {
  var urlPattern = /(https?:\/\/[^\s]+)/g;
  var urls = messageText.match(urlPattern);

  if (urls) {
    urls.forEach(function (url) {
      // YouTubeのURLのみをフィルタリング
      if (isYouTubeUrl(url)) {
        appendUrlToSheet(url, sheet);
        replyToLine(replyToken, '🚚 発言されたYoutubeのURLを取りまとめシート( https://docs.google.com/spreadsheets/d/1_3ni67C36-eeqGRbA80_5YfWghFSUAVVdtL7tU9MraM )に登録しました');
      }
    });
  }
}

export const doPost = (event: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput => {
  const json = JSON.parse(event.postData.contents);
  const outputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(outputSheetName);
  if (outputSheet === null) {
    throw new Error(`スプレッドシート「${outputSheet}」の取得に失敗しました`);
  }

  // LINE Webhookからのイベントを処理
  const events = json.events;

  events.forEach(function (event: any) {
    // テキストメッセージの場合のみ処理
    if (event.type === 'message' && event.message.type === 'text') {
      var messageText = event.message.text;
      processMessage(messageText, outputSheet, event.replyToken);
    }
  });

  // LINE側に正常に成功したことを示すレスポンスを返す必要があるのでレスポンスを作成
  const response = ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
  return response
}

// GASから参照したい変数はglobalオブジェクトに渡してあげる必要がある
(global as any).doPost = doPost;