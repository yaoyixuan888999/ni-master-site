const apiBase = "https://rebel-ra-suggestion-density.trycloudflare.com";

// 聊天气泡展示
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

  chatBox.scrollTop = chatBox.scrollHeight; // 自动滚动到底部
}

// 动态根据时间提示时辰
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
  updateInputVisibility(); // 页面加载时初始化

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

// 提交分析
async function submitData() {
  const type = document.getElementById('analysisType').value;
  const resultBlock = document.getElementById('resultBlock');
  const chatBox = document.getElementById('chatBox');

  chatBox.innerHTML = ""; // 清空历史，重新开始分析
  resultBlock.classList.remove('hidden');

  let text = "";
  let imageUrl = "";

  if (type === 'bazi') {
    const calendarType = document.getElementById('calendarType').value;
    const birthDate = document.getElementById('birthDate').value;
    const birthTime = document.getElementById('birthTime').value;
    const birthPlace = document.getElementById('birthPlace').value.trim();
    let birthDesc = "";

    if (!birthDate || !birthTime) {
      alert("请选择完整的出生日期和时间！");
      return;
    }

    // 提取时辰信息
    const hour = parseInt(birthTime.split(":")[0], 10);
    const chineseHour = getChineseHourLabel(hour);

    if (calendarType === 'lunar') {
      // 农历转公历
      const lunarParts = birthDate.split("-");
      const lunarYear = parseInt(lunarParts[0]);
      const lunarMonth = parseInt(lunarParts[1]);
      const lunarDay = parseInt(lunarParts[2]);
      const solar = solarlunar.lunar2solar(lunarYear, lunarMonth, lunarDay);

      birthDesc = `农历${lunarYear}年${lunarMonth}月${lunarDay}日 ${chineseHour} ${birthPlace}（公历：${solar.cYear}-${solar.cMonth}-${solar.cDay}）`;
    } else {
      // 公历直接
      birthDesc = `公历${birthDate} ${chineseHour} ${birthPlace}`;
    }

    text = `八字分析：${birthDesc}`;
  } else {
    const imageInput = document.getElementById('imageInput');
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
    birth: "", // 暂时不传 birth 字段，所有内容在 text
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
