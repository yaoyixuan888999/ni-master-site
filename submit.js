const typeSelect = document.getElementById('analysisType');
const imageUploadBlock = document.getElementById('imageUploadBlock');
const birthInputBlock = document.getElementById('birthInputBlock');
const result = document.getElementById('resultBlock');
const resultText = document.getElementById('resultText');

// 自动切换输入方式
typeSelect.addEventListener('change', () => {
  if (typeSelect.value === 'bazi') {
    imageUploadBlock.classList.add('hidden');
    birthInputBlock.classList.remove('hidden');
  } else {
    imageUploadBlock.classList.remove('hidden');
    birthInputBlock.classList.add('hidden');
  }
});

// 提交分析
async function submitData() {
  const type = document.getElementById('analysisType').value;
  const imageInput = document.getElementById('imageInput');
  const birth = document.getElementById('birthInput')?.value || '';

  result.classList.remove('hidden');
  resultText.innerText = '⏳ 倪大师掐指一算中，请稍候...';

  if (type !== 'bazi' && imageInput.files.length === 0) {
    resultText.innerText = '请上传图像后再提交。';
    return;
  }

  let base64Image = '';
  if (type !== 'bazi') {
    const file = imageInput.files[0];
    base64Image = await toBase64(file);
  }

  const payload = {
    type,
    birth,
    image: base64Image,
    time: new Date().toISOString(),
    text: `分析类型: ${type}, 出生信息: ${birth}`
  };

  try {
    // ✅ 提交到 Make webhook（确保链接有效）
    await fetch('https://hook.us2.make.com/qopqcxklpfcksak3nzpkilnqp33ae281', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    resultText.innerText = '✅ 大师已接收，请等待结果返回...';

    // ✅ 轮询后台结果（使用 Ngrok 公网地址）
    const maxAttempts = 20;
    const interval = 3000;
    let attempt = 0;

    while (attempt < maxAttempts) {
      const res = await fetch('https://sources-coverage-herald-downloading.trycloudflare.com/result');
      const contentType = res.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();

        if (data.status === 'done') {
          resultText.innerText = data.reply || '大师尚未言传，请稍候再试。';
          return;
        } else if (data.status === 'empty') {
          resultText.innerText = '⚠️ 暂未获取到回复，请稍后重试或联系管理员';
          return;
        }
      } else {
        console.warn('返回的是 HTML 页面，可能是 Ngrok 被限流了');
        resultText.innerText = '⚠️ 服务暂时不可用，请稍后刷新页面重试。';
        return;
      }

      await new Promise(r => setTimeout(r, interval));
      attempt++;
    }

    resultText.innerText = '⚠️ 等待超时，请稍后刷新查看或联系管理员';

  } catch (error) {
    console.error('❌ 提交失败：', error);
    resultText.innerText = '❌ 提交失败，请稍后再试。';
  }
}

// 图片转 Base64
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
