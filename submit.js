const apiBase = "https://rebel-ra-suggestion-density.trycloudflare.com";

function appendMessage(role, text) {
  const chatBox = document.getElementById('chatBox');
  const wrapper = document.createElement('div');
  wrapper.classList.add('flex', role === 'user' ? 'justify-end' : 'justify-start');

  const bubble = document.createElement('div');
  bubble.classList.add('px-3', 'py-2', 'rounded-lg', 'max-w-xs', 'whitespace-pre-line', 'text-sm');

  if (role === 'user') {
    bubble.classList.add('bg-blue-400', 'text-white');
    bubble.textContent = `👤 你：\n${text}`;
  } else {
    bubble.classList.add('bg-gray-300', 'text-gray-800');
    bubble.textContent = `🧙 大师：\n${text}`;
  }

  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);

  chatBox.scrollTop = chatBox.scrollHeight; // 自动滚动到最底部
}

// 动态切换显示上传 or 出生时间
document.getElementById('analysisType').addEventListener('change', function () {
  const type = this.value;
  const imageUploadBlock = document.getElementById('imageUploadBlock');
  const birthInputBlock = document.getElementById('birthInputBlock');

  if (type === 'bazi') {
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
