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
    text = birthInput.value.trim(); // 保持八字逻辑不变
  } else {
    const file = imageInput.files[0];
    if (!file) {
      alert("请上传图像！");
      return;
    }

    appendMessage("user", "📤 正在上传图片，请稍候...");

    // ✅ 使用 imgbb API 上传图片
    const formData = new FormData();
    formData.append("image", file);

    try {
      const uploadRes = await fetch("https://api.imgbb.com/1/upload?key=20626186930867aca68ddb211182e0c8", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error("图床上传失败");

      imageUrl = uploadData.data.url;
      text = `${type} 分析图像已上传，地址：${imageUrl}`;
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
    birth: birthInput?.value || "",
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
