// AI Prompt Manager - Content Script

// 复制到剪贴板
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('📋 已复制到剪贴板，请手动粘贴 (Ctrl+V)');
  }).catch(error => {
    console.error('复制失败:', error);
    showNotification('❌ 复制失败');
  });
}

// 转义属性
function escapeAttr(text) {
  return text.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
}

// 显示通知
function showNotification(message) {
  const old = document.querySelector('.ai-prompt-notification');
  if (old) old.remove();
  
  const notification = document.createElement('div');
  notification.className = 'ai-prompt-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 14px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    z-index: 999999;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease;
    max-width: 350px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 3000);
  }, 3000);
}

// 注入侧边栏
function injectSidebar() {
  if (document.getElementById('ai-prompt-sidebar')) {
    return;
  }
  
  const sidebar = document.createElement('div');
  sidebar.id = 'ai-prompt-sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h3>🎭 角色 Prompt</h3>
      <div class="sidebar-controls">
        <button id="toggle-sidebar" title="折叠/展开">−</button>
        <button id="close-sidebar" title="关闭">×</button>
      </div>
    </div>
    <div class="sidebar-content">
      <div id="prompts-display">加载中...</div>
    </div>
  `;
  document.body.appendChild(sidebar);
  
  loadPromptsToSidebar();
  
  // 折叠/展开
  document.getElementById('toggle-sidebar').addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const btn = document.getElementById('toggle-sidebar');
    btn.textContent = sidebar.classList.contains('collapsed') ? '+' : '−';
  });
  
  // 关闭按钮
  document.getElementById('close-sidebar').addEventListener('click', () => {
    sidebar.style.display = 'none';
  });
  
  // 监听存储变化
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.prompts) {
        loadPromptsToSidebar();
      }
      if (changes.sidebarEnabled) {
        if (changes.sidebarEnabled.newValue === false) {
          sidebar.style.display = 'none';
        }
      }
    }
  });
}

// 加载角色到侧边栏
async function loadPromptsToSidebar() {
  try {
    const data = await chrome.storage.local.get(['prompts']);
    const prompts = data.prompts || [];
    
    const promptsDisplay = document.getElementById('prompts-display');
    if (!promptsDisplay) return;
    
    if (prompts.length === 0) {
      promptsDisplay.innerHTML = '<div style="color: #999; text-align: center; padding: 20px;">暂无角色<br><small>请在插件中添加</small></div>';
      return;
    }
    
    promptsDisplay.innerHTML = prompts.map(prompt => `
      <div class="prompt-card-small" data-id="${prompt.id}">
        <div class="prompt-title-small">${prompt.icon} ${prompt.name}</div>
        <button class="btn-copy" data-content='${escapeAttr(prompt.content)}'>📋 复制</button>
      </div>
    `).join('');
    
    // 绑定复制事件
    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const content = btn.getAttribute('data-content');
        copyToClipboard(content);
      });
    });
  } catch (error) {
    console.error('加载失败:', error);
  }
}

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'copyPrompt') {
    copyToClipboard(request.content);
    sendResponse({ success: true });
  } else if (request.action === 'showSidebar') {
    const sidebar = document.getElementById('ai-prompt-sidebar');
    if (sidebar) {
      sidebar.style.display = 'block';
    }
    sendResponse({ success: true });
  } else if (request.action === 'hideSidebar') {
    const sidebar = document.getElementById('ai-prompt-sidebar');
    if (sidebar) {
      sidebar.style.display = 'none';
    }
    sendResponse({ success: true });
  }
  return true;
});

// 页面加载后注入（检查开关状态）
async function init() {
  const data = await chrome.storage.local.get(['sidebarEnabled']);
  if (data.sidebarEnabled !== false) {
    // 开关开启，注入侧边栏
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectSidebar);
    } else {
      injectSidebar();
    }
  }
}

init();
