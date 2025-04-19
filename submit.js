async function submitData() {
  const analysisType = document.getElementById('analysisType').value;
  const imageInput = document.getElementById('imageInput');
  const birthInput = document.getElementById('birthInput').value;

  const resultBlock = document.getElementById('resultBlock');
  const resultText = document.getElementById('resultText');
  resultBlock.classList.add('hidden');
  resultText.innerText = "⏳ 倪大师正在分析中，请稍候...";

  let text = '';

  if (analysisType === 'bazi') {
    text = birthInput.trim();
    if (!text) {
      alert('请输入出生信息！');
      return;
    }
  } else {
    const file = imageInput.files[0];
    if (!file) {
      alert('请上传图像文件！');
      return;
    }

    // 临时预览地址（Make 可选择是否接收）
    const tempUrl = URL.createObjectURL(file);
    text = `${analysisType}#${tempUrl}`;
  }

  // 你在 Make 中配置的 Webhook 地址
  const webhookUrl = "https://hook.us2.make.com/qopqcxklpfcksak3nzpkilnqp33ae281";

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (res.ok) {
      resultText.innerText = "✅ 数据已发送至大师，等待分析中...";
      resultBlock.classList.remove('hidden');
      pollResult(); // 开始轮询后端获取结果
    } else {
      throw new Error("Make Webhook 提交失败");
    }
  } catch (err) {
    console.error("❌ 提交失败：", err);
    resultText.innerText = "❌ 提交失败，请稍后重试。";
    resultBlock.classList.remove('hidden');
  }
}

async function pollResult() {
  const resultText = document.getElementById('resultText');
  const resultBlock = document.getElementById('resultBlock');

  const interval = setInterval(async () => {
    try {
      const res = await fetch("https://coding-resist-candidates-calls.trycloudflare.com/result");
      if (res.status === 200) {
        const data = await res.json();
        clearInterval(interval);
        resultText.innerText = data.reply;
        resultBlock.classList.remove('hidden');
      } else if (res.status === 202 || res.status === 204) {
        console.log("⌛ 等待分析结果...");
      } else {
        throw new Error("服务器响应异常");
      }
    } catch (err) {
      clearInterval(interval);
      resultText.innerText = "❌ 获取分析结果失败：" + err.message;
      resultBlock.classList.remove('hidden');
    }
  }, 3000); // 每 3 秒轮询一次
}
