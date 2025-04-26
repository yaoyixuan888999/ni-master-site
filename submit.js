const apiBase = "https://rebel-ra-suggestion-density.trycloudflare.com";

function appendMessage(role, text) {
  const chatBox = document.getElementById('chatBox');
  const wrapper = document.createElement('div');
  wrapper.classList.add('mb-2');

  const label = document.createElement('strong');
  label.textContent = role === 'user' ? '👤 你：' : '🧙 大师：';

  const message = document.createElement('div');
  message.textContent = text;
  message.classList.add('whitespace-pre-line');

  wrapper.appendChild(label);
  wrapper.appendChild(message);
  chatBox.appendChild(wrapper);

  chatBox.scrollTop = chatBox.scrollHeight; // 自动滚动到底部
}

async function submitData() {
  const type = document.getElementById('analysisType').value;
  const imageInput = document.getElementById('imageInput');
  const birthInput = document.getElementById('birthInput');
  const resultBlock = document.getElementById('resultBlock');
  const chatBox = document.getElementById('chatBox');

  chatBox.innerHTML = ""; // 清空历史，重新开始分析
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
    imageUrl = blobUrl;
    text = `${type} 分析图片上传。`;
  }

  appendMessage("user", text);

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
    appendMessage("assistant", data.reply);
    localStorage.setItem('session_id', data.session_id);
  } else {
    appendMessage("assistant", "❌ 分析失败：" + data.message);
  }
}

// 继续追问
async function followupAsk() {
  const followupInput = document.getElementById('followupInput');
  const text = followupInput.value.trim();
  if (!text) {
    alert("请输入追问内容！");
    return;
  }

  appendMessage("user", text);

  const payload = {
    session_id: localStorage.getItem('session_id') || null,
    type: "followup",
    text,
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
    appendMessage("assistant", data.reply);
    followupInput.value = "";
  } else {
    appendMessage("assistant", "❌ 追问失败：" + data.message);
  }
}
