const apiBase = "https://rebel-ra-suggestion-density.trycloudflare.com";

async function submitData() {
  const type = document.getElementById('analysisType').value;
  const imageInput = document.getElementById('imageInput');
  const birthInput = document.getElementById('birthInput');
  const resultBlock = document.getElementById('resultBlock');
  const resultText = document.getElementById('resultText');

  resultText.innerText = "⏳ 正在分析...";
  resultBlock.classList.remove('hidden');

  let text = "";
  let imageUrl = "";

  if (type === 'bazi') {
    text = birthInput.value.trim();
  } else {
    const file = imageInput.files[0];
    if (!file) {
      alert("请上传图像！");
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    imageUrl = blobUrl; // ❗正式版推荐上传图床后使用
    text = `${type} 分析图片上传。`;
  }

  const payload = {
    session_id: localStorage.getItem('session_id') || null,
    type,
    image: imageUrl,
    birth: birthInput.value,
    text
  };

  const res = await fetch(`${apiBase}/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (data.status === 'done') {
    resultText.innerText = "🧙 大师解析：\n" + data.reply;
    resultBlock.classList.remove('hidden');
    localStorage.setItem('session_id', data.session_id);
  } else {
    resultText.innerText = "❌ 分析失败：" + data.message;
  }
}

// 新增：继续追问功能
async function followupAsk() {
  const followupInput = document.getElementById('followupInput');
  const resultText = document.getElementById('resultText');
  const text = followupInput.value.trim();

  if (!text) {
    alert("请输入追问内容！");
    return;
  }

  const payload = {
    session_id: localStorage.getItem('session_id') || null,
    type: "followup",
    text: text,
    image: null,
    birth: ""
  };

  const res = await fetch(`${apiBase}/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (data.status === 'done') {
    resultText.innerText += "\n\n🧙 大师继续解答：\n" + data.reply;
    followupInput.value = "";
  } else {
    alert("❌ 追问失败：" + data.message);
  }
}
