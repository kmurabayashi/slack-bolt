import "./utils/env";
import { App, LogLevel, AwsLambdaReceiver } from '@slack/bolt';
import { isGenericMessageEvent } from './utils/helpers'

// カスタムのレシーバーを初期化します
const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  // signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.DEBUG,
  receiver: awsLambdaReceiver,
  // `processBeforeResponse` オプションは、あらゆる FaaS 環境で必須です。
  // このオプションにより、Bolt フレームワークが `ack()` などでリクエストへの応答を返す前に
  // `app.message` などのメソッドが Slack からのリクエストを処理できるようになります。FaaS では
  // 応答を返した後にハンドラーがただちに終了してしまうため、このオプションの指定が重要になります。
  processBeforeResponse: true
});

// Listens to incoming messages that contain "hello"
app.message('ping', async ({ message, say }) => {

  // Filter out message events with subtypes (see https://api.slack.com/events/message)
  // Is there a way to do this in listener middleware with current type system?
  if (!isGenericMessageEvent(message)) return;
  // say() sends a message to the channel where the event was triggered

  await say('pong');
});

// チャンネル作られたら
app.event('channel_created', async ({ event, client }) => {
  try {
    if(event.channel.name.startsWith('rec')) return
    const result = await client.chat.postMessage({
      channel: 'C0159613138',
      text: ` <#${event.channel.id}> が<@${event.channel.creator}>によって作成されました。`
    });
  }
  catch (error) {
    console.error(error);
  }
});


// Lambda 関数のイベントを処理します
module.exports.handler = async (event: any, context: any, callback: any) => {
  const handler = await awsLambdaReceiver.start();
  return handler(event, context, callback);

}