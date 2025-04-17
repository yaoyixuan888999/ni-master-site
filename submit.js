const typeSelect = document.getElementById('analysisType');
const imageUploadBlock = document.getElementById('imageUploadBlock');
const birthInputBlock = document.getElementById('birthInputBlock');
const result = document.getElementById('resultBlock');
const resultText = document.getElementById('resultText');

typeSelect.addEventListener('change', () => {
  if (typeSelect.value === 'bazi') {
    imageUploadBlock.classList.add('hidden');
    birthInputBlock.classList.remove('hidden');
  } else {
    imageUploadBlock.classList.remove('hidden');
    birthInputBlock.classList.add('hidden');
  }
});

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

  // ✅ 非阻塞方式提交给 Make
  fetch('https://hook.us2.make.com/你的-webhook-id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(() => {
    resultText.innerText = '✅ 大师已接收，请等待结果返回...';
    pollResult();
  })
  .catch(error => {
    console.error('提交失败：', error);
    resultText.innerText = '❌ 提交失败，请稍后再试。';
  });
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// ✅ 轮询 Flask 服务获取分析结果
async function pollResult() {
  const maxTries = 20;
  const interval = 3000; // 每3秒轮询一次

  for (let i = 0; i < maxTries; i++) {
    try {
      const res = await fetch('https://7f6c-85-12-6-95.ngrok-free.app/result');
      const data = await res.json();

      if (data.status === 'done') {
        resultText.innerText = data.reply;
        return;
      } else if (data.status === 'empty') {
        resultText.innerText = '⚠️ 暂无结果，请稍后重试。';
        return;
      } else if (data.status === 'error') {
        resultText.innerText = `❌ 错误：${data.message}`;
        return;
      }

    } catch (e) {
      console.warn('轮询中断，等待重试...');
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  resultText.innerText = '⚠️ 等待超时，请稍后刷新查看或联系客服。';
}
