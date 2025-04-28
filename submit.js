const apiBase = "https://request-ken-ne-extreme.trycloudflare.com"; // 你的最新Cloudflare地址

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

  chatBox.scrollTop = chatBox.scrollHeight;
}

function getChineseHourLabel(hour) {
  if (hour >= 23 || hour < 1) return "子时";
  if (hour >= 1 && hour < 3) return "丑时";
  if (hour >= 3 && hour < 5) return "寅时";
  if (hour >= 5 && hour < 7) return "卯时";
  if (hour >= 7 && hour < 9) return "辰时";
  if (hour >= 9 && hour < 11) return "巳时";
  if (hour >= 11 && hour < 13) return "午时";
  if (hour >= 13 && hour < 15) return "未时";
  if (hour >= 15 && hour < 17) return "申时";
  if (hour >= 17 && hour < 19) return "酉时";
  if (hour >= 19 && hour < 21) return "戌时";
  if (hour >= 21 && hour < 23) return "亥时";
  return "";
}

document.addEventListener('DOMContentLoaded', () => {
  const analysisTypeSelect = document.getElementById('analysisType');
  const imageUploadBlock = document.getElementById('imageUploadBlock');
  const birthInputBlock = document.getElementById('birthInputBlock');
  const birthTimeInput = document.getElementById('birthTime');
  const timeHint = document.getElementById('timeHint');

  function updateInputVisibility() {
    const type = analysisTypeSelect.value;
    if (type === 'bazi') {
      imageUploadBlock.classList.add('hidden');
      birthInputBlock.classList.remove('hidden');
    } else {
      imageUploadBlock.classList.remove('hidden');
      birthInputBlock.classList.add('hidden');
    }
  }

  analysisTypeSelect.addEventListener('change', updateInputVisibility);
  updateInputVisibility();

  birthTimeInput.addEventListener('change', () => {
    const timeValue = birthTimeInput.value;
    if (timeValue) {
      const hour = parseInt(timeValue.split(":")[0], 10);
      const label = getChineseHourLabel(hour);
      timeHint.textContent = label ? `（${label}）` : "";
    } else {
      timeHint.textContent = "";
    }
  });
});

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${apiBase}/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (data.status === 'done') {
    return data.url;
  } else {
    throw new Error(data.message || "上传失败");
  }
}

async function submitData() {
  const type = document.getElementById('analysisType').value;
  const resultBlock = document.getElementById('resultBlock');
  const chatBox = document.getElementById('chatBox');

  chatBox.innerHTML = "";
  resultBlock.classList.remove('hidden');

  let text = "";
  let imageUrl = "";

  if (type === 'bazi') {
    const calendarType = document.getElementById('calendarType').value;
    const birthDate = document.getElementById('birthDate').value;
    const birthTime = document.getElementById('birthTime').value;
    const birthPlace = document.getElementById('birthPlace').value.trim();
    if (!birthDate || !birthTime) {
      alert("请选择完整的出生日期和时间！");
      return;
    }
    const hour = parseInt(birthTime.split(":")[0], 10);
    const chineseHour = getChineseHourLabel(hour);
    if (calendarType === 'lunar') {
      const lunarParts = birthDate.split("-");
      const solar = solarlunar.lunar2solar(parseInt(lunarParts[0]), parseInt(lunarParts[1]), parseInt(lunarParts[2]));
      text = `农历${lunarParts[0]}年${lunarParts[1]}月${lunarParts[2]}日 ${chineseHour} ${birthPlace}（公历：${solar.cYear}-${solar.cMonth}-${solar.cDay}）`;
    } else {
      text = `公历${birthDate} ${chineseHour} ${birthPlace}`;
    }
  } else {
    const imageInput = document.getElementById('imageInput');
    const file = imageInput.files[0];
    if (!file) {
      alert("请上传图像！");
      return;
    }
    appendMessage("user", "📤 正在上传图片，请稍候...");
    try {
      imageUrl = await uploadImage(file);
      text = `${type} 图片上传成功，准备分析...`;
    } catch (err) {
      appendMessage("assistant", "❌ 图片上传失败：" + err.message);
      return;
    }
  }

  appendMessage("user", text);

  const payload = {
    session_id: localStorage.getItem('session_id') || null,
    type,
    image: imageUrl,
    birth: "",
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
