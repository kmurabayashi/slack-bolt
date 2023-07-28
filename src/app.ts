import "./utils/env";
import { App, LogLevel, AwsLambdaReceiver } from '@slack/bolt';
import { isGenericMessageEvent } from './utils/helpers'

// カスタムのレシーバーを初期化します
const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: LogLevel.DEBUG,
  receiver: awsLambdaReceiver,
  processBeforeResponse: true
});

// 動作確認用
app.message('ping', async ({ message, say }) => {
  if (!isGenericMessageEvent(message)) return;
  await say('pong');
});

// チャンネル作られたら
app.event('channel_created', async ({ event, client }) => {
  try {
    if(event.channel.name.startsWith('rec')) return
    await client.chat.postMessage({
      channel: process.env.NOTIFY_CREATE_CHANNEL_ID || '',
      text: ` <#${event.channel.id}> が<@${event.channel.creator}>によって作成されました。`
    });
  }
  catch (error) {
    console.error(error);
  }
});

// 誰かをアサインする
app.command('/random_assign', async ({ command, ack, client }) => {
  // コマンドリクエストを確認
  await ack();
  const candidate = []
  let target = ''
  if(command.text === 'all') {
    target = candidate[Math.floor(Math.random() * candidate.length)]
  } else {
    const newCandidate = candidate.filter(n => n !== command.user_id);
    target = newCandidate[Math.floor(Math.random() * newCandidate.length)]
  }
  await client.chat.postMessage({
    channel: process.env.NOTIFY_CREATE_CHANNEL_ID || '',
    text: `<@${target}>さんお願いします`
  });
});

// Lambda 関数のイベントを処理
module.exports.handler = async (event: any, context: any, callback: any) => {
  const handler = await awsLambdaReceiver.start();
  return handler(event, context, callback);

}
