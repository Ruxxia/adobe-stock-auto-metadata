let selectedApiKey = "";

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['saved_api_key'], (result) => {
    if (result && result.saved_api_key) {
      selectedApiKey = result.saved_api_key;
      showKeyStoredUI();
    }
  });
});

function showKeyStoredUI() {
  document.getElementById('apiSelectorGroup').style.display = 'none';
  document.getElementById('keyStoredGroup').style.display = 'block';
  document.getElementById('status').innerText = "Ready to launch!";
}

document.getElementById('changeKeyBtn').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('apiSelectorGroup').style.display = 'block';
  document.getElementById('keyStoredGroup').style.display = 'none';
  document.getElementById('status').innerText = "Please choose new file";
});

document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result ? e.target.result.trim() : "";
    if (content) {
      selectedApiKey = content;
      chrome.storage.local.set({ saved_api_key: content }, () => {
        showKeyStoredUI();
      });
    }
  };
  reader.readAsText(file);
});

document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result.trim();
    if (content) {
      selectedApiKey = content;
      chrome.storage.local.set({ saved_api_key: content }, () => {
        document.getElementById('keyDisplay').style.display = "block";
        document.getElementById('status').innerText = "API Key successfuly saved!";
      });
    }
  };
  reader.readAsText(file);
});

async function startAutoPilot() {
  const statusEl = document.getElementById('status');
  const modelName = document.getElementById('modelSelect').value;
  const delayMs = (parseInt(document.getElementById('delayInput').value) || 2) * 1000;

  if (!selectedApiKey) {
    statusEl.innerText = "Error: API Key missing!";
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, { action: "get_active_image" }, async (response) => {
    if (!response || !response.url) {
      statusEl.innerText = "Completed or File not found !";
      return;
    }

    try {
      statusEl.innerText = "Analyzing . . .";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${selectedApiKey}`;
      
      const apiRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: "Return ONLY: Title | 49 Keywords. English. No extra text." },
            { inline_data: { mime_type: "image/jpeg", data: await getBase64FromUrl(response.url) } }
          ]}]
        })
      });

      const data = await apiRes.json();
      
      if (data.error) throw new Error(data.error.message);
  
      const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!fullText) throw new Error("No AI response found.");

      const parts = fullText.split('|');
      if (parts.length < 2) {
        console.error("Wrong AI format:", fullText);
        parts[1] = "stock, photo, image"; 
      }

      const title = parts[0] ? parts[0].trim() : "Untitled";
      const keywords = parts[1] ? parts[1].trim() : "stock, photo";

      chrome.tabs.sendMessage(tab.id, {
        action: "fill_and_move_next",
        title: title.trim(),
        keywords: keywords.trim(),
        delay: delayMs
        }, (res) => {
        if (chrome.runtime.lastError) {
            console.warn("Connection Closed, Trying to continue . . . .");
            setTimeout(startAutoPilot, 3000);
            return;
        }

        if (res && res.hasMore) {
            statusEl.innerText = "Move to next files...";
            setTimeout(startAutoPilot, 2500); 
        } else {
            statusEl.innerText = "All files has been proccesed !";
        }
    });

    } catch (err) {
      statusEl.innerText = "Error: " + err.message;
      console.error("Error Line 92:", err);
    }
  });
}

document.getElementById('runBtn').addEventListener('click', startAutoPilot);

async function getBase64FromUrl(url) {
  const data = await fetch(url);
  const blob = await data.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
}