
// submit.js

const typeSelect = document.getElementById('analysisType');
const imageUploadBlock = document.getElementById('imageUploadBlock');
const birthInputBlock = document.getElementById('birthInputBlock');

// 切换分析类型时显示/隐藏上传区
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
  const result = document.getElementById('resultBlock');
  const resultText = document.getElementById('resultText');

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
    await fetch('https://4a91-85-12-6-95.ngrok-free.app/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

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
      const response = await fetch('https://4a91-85-12-6-95.ngrok-free.app/result');
      const data = await response.json();

      if (data.status === 'done') {
        resultText.innerText = data.reply;
        return;
      }
    } catch (e) {
      console.log('轮询错误:', e);
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  resultText.innerText = '⚠️ 暂未获取到回复，请稍后手动查看。';
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
