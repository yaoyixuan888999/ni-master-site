async function submitData() {
  const analysisType = document.getElementById('analysisType').value;
  const imageInput = document.getElementById('imageInput');
  const birthInput = document.getElementById('birthInput').value;

  const resultBlock = document.getElementById('resultBlock');
  const resultText = document.getElementById('resultText');
  resultBlock.classList.add('hidden');
  resultText.innerText = "⏳ 正在分析中，请稍候...";

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

    // 读取图片转成 base64 或使用占位路径
    const formData = new FormData();
    formData.append('image', file);

    // 临时生成图片链接（推荐改成上传到图床并返回 URL）
    const tempUrl = URL.createObjectURL(file);
    text = `${analysisType}#${tempUrl}`;
  }

  try {
    const res = await fetch("https://sources-coverage-herald-downloading.trycloudflare.com/trigger", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    const result = await res.json();
    console.log("🎯 后端返回：", result);

    if (result.status === "success") {
      resultText.innerText = "✅ 分析任务已提交，正在等待结果...";
      resultBlock.classList.remove('hidden');
      pollResult();
    } else {
      resultText.innerText = "❌ 提交失败：" + result.message;
      resultBlock.classList.remove('hidden');
    }

  } catch (err) {
    console.error("❌ 提交失败：", err);
    resultText.innerText = "❌ 提交失败，请稍后再试。";
    resultBlock.classList.remove('hidden');
  }
}

async function pollResult() {
  const resultText = document.getElementById('resultText');
  const resultBlock = document.getElementById('resultBlock');

  const interval = setInterval(async () => {
    try {
      const res = await fetch("https://sources-coverage-herald-downloading.trycloudflare.com/result");
      if (res.status === 200) {
        const data = await res.json();
        clearInterval(interval);
        resultText.innerText = data.reply;
        resultBlock.classList.remove('hidden');
      } else if (res.status === 204 || res.status === 202) {
        console.log("⏳ 等待结果中...");
      } else {
        throw new Error("服务器返回错误");
      }
    } catch (err) {
      clearInterval(interval);
      resultText.innerText = "❌ 获取结果失败：" + err.message;
      resultBlock.classList.remove('hidden');
    }
  }, 3000); // 每 3 秒轮询一次
}
