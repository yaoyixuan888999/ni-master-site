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

  try {
    // ✅ 发给 Make webhook，不动
    await fetch('https://hook.us2.make.com/qopqcxklpfcksak3nzpkilnqp33ae281', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    resultText.innerText = '✅ 大师已接收，请等待结果返回...';

    // ✅ 启动轮询，去 Flask 后端取结果
    pollResult();

  } catch (error) {
    console.error('提交失败：', error);
    resultText.innerText = '❌ 提交失败，请稍后再试。';
  }
}

async function pollResult() {
  const resultText = document.getElementById('resultText');
  for (let i = 0; i < 20; i++) {
    try {
      const response = await fetch('https://7f6c-85-12-6-95.ngrok-free.app/result');
      const data = await response.json();

      if (data.status === 'done') {
        resultText.innerText = data.reply;
        return;
      }
    } catch (e) {
      console.warn('轮询失败，等待中...', e);
    }

    await new Promise(resolve => setTimeout(resolve, 3000)); // 每 3 秒轮询一次
  }

  resultText.innerText = '⚠️ 等待超时，请稍后刷新查看或联系管理员';
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
