export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const data = req.body;

  try {
    const webhookUrl = 'https://hook.us2.make.com/qopqcxklpfcksak3nzpkilnqp33ae281'; // 你的 Make Webhook

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`);
    }

    res.status(200).json({ message: '已成功发送到大师系统' });
  } catch (error) {
    console.error('转发 Webhook 失败：', error);
    res.status(500).json({ message: '转发失败', error: error.message });
  }
}
