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
    text: `用户类型:${type},分析类型:${type},图片:${base64Image ? '(已上传)' : '无'},问题:请分析该用户的性格与近期运势`
  };

  try {
    // ✅ 提交数据到 Make 接口
    const res = await fetch('https://hook.us2.make.com/qopqcxklpfcksak3nzpkilnqp33ae281', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('提交失败');

    resultText.innerText = '✅ 大师已接收，请等待结果返回...';

    // ✅ 开始轮询结果
    let attempts = 0;
    const maxAttempts = 15;
    const pollInterval = 3000;

    const pollResult = async () => {
      const response = await fetch('https://7f6c-85-12-6-95.ngrok-free.app/result');
      const jsonText = await response.text();

      try {
        const data = JSON.parse(jsonText);
        if (data.status === 'done') {
          resultText.innerText = decodeUnicode(data.reply);
          return;
        }
      } catch (err) {
        console.warn('⚠️ 无法解析 JSON：', jsonText);
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(pollResult, pollInterval);
      } else {
        resultText.innerText = '⚠️ 暂未获取到回复，请稍后手动查看。';
      }
    };

    setTimeout(pollResult, pollInterval);

  } catch (error) {
    console.error('提交失败：', error);
    resultText.innerText = '❌ 提交失败，请稍后再试。';
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function decodeUnicode(str) {
  try {
    return JSON.parse(`"${str.replace(/"/g, '\\"')}"`);
  } catch (err) {
    return str;
  }
}
