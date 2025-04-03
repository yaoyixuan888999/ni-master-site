export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const data = req.body;

  try {
    const webhookUrl = 'https://hook.us2.make.com/qopqcxklpfcksak3nzpkilnqp33ae281';

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

    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error('Error forwarding to Webhook:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}
