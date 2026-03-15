// AI Prompt Manager - Popup Script

// 图标列表
const ICONS = [
  '🎭', '💻', '📝', '🌐', '🎨', '📊', '💼', '🍳',
  '🏋️', '🎵', '📱', '⚖️', '👨‍⚕️', '🎓', '🔬', '📚',
  '🎬', '🎮', '✈️', '🏠', '🚗', '📷', '🎪', '🎯',
  '🤖', '👻', '🦄', '🐙', '🦊', '🦁', '🐯', '🐼',
  '⭐', '🔥', '💡', '🎉', '❤️', '✨', '🌟', '💫'
];

// 全局变量
window.g_editingId = null;
window.g_prompts = [];
window.g_selectedIcon = '🎭';

// 初始化图标选择器
function initIconPicker() {
  const iconPicker = document.getElementById('iconPicker');
  const iconInput = document.getElementById('promptIcon');
  const iconPreview = document.getElementById('iconPreview');
  
  if (!iconPicker) return;
  
  iconPicker.innerHTML = ICONS.map(icon => `
    <div class="icon-option" data-icon="${icon}">${icon}</div>
  `).join('');
  
  // 绑定点击事件
  iconPicker.querySelectorAll('.icon-option').forEach(option => {
    option.addEventListener('click', () => {
      const icon = option.getAttribute('data-icon');
      window.g_selectedIcon = icon;
      
      // 更新选中状态
      iconPicker.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      
      // 更新输入框和预览
      if (iconInput) iconInput.value = icon;
      if (iconPreview) iconPreview.textContent = icon;
    });
  });
  
  // 监听输入框变化
  if (iconInput) {
    iconInput.addEventListener('input', (e) => {
      window.g_selectedIcon = e.target.value;
      if (iconPreview) iconPreview.textContent = e.target.value;
    });
  }
}

// 加载角色列表
async function loadPrompts() {
  console.log('加载角色列表...');
  try {
    const data = await chrome.storage.local.get(['prompts']);
    console.log('storage data:', data);
    
    window.g_prompts = Array.isArray(data.prompts) ? data.prompts : [];
    console.log('prompts:', window.g_prompts);
    
    const promptsList = document.getElementById('promptsList');
    if (!promptsList) {
      console.error('找不到 promptsList 元素');
      return;
    }
    
    if (window.g_prompts.length === 0) {
      promptsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div>暂无角色</div>
          <div style="font-size: 13px; margin-top: 10px;">点击下方按钮添加第一个角色</div>
        </div>
      `;
      return;
    }
    
    // 创建列表
    promptsList.innerHTML = '';
    window.g_prompts.forEach((prompt, index) => {
      if (!prompt || !prompt.id) return;
      
      const card = document.createElement('div');
      card.className = 'prompt-card';
      card.dataset.index = index;
      card.dataset.id = prompt.id;
      
      card.innerHTML = `
        <div class="prompt-header">
          <div class="prompt-title">${prompt.icon || '🎭'} ${prompt.name || '未命名'}</div>
        </div>
        <div class="prompt-preview">${escapeHtml(prompt.content || '')}</div>
        <div class="prompt-actions">
          <button class="btn btn-primary btn-copy">📋 复制</button>
          <button class="btn btn-secondary btn-edit">✏️ 编辑</button>
          <button class="btn btn-danger btn-delete">🗑️ 删除</button>
        </div>
      `;
      
      promptsList.appendChild(card);
    });
    
    // 绑定事件
    bindEvents();
    
    console.log('角色列表已加载，共', window.g_prompts.length, '个角色');
  } catch (error) {
    console.error('加载失败:', error);
    const promptsList = document.getElementById('promptsList');
    if (promptsList) {
      promptsList.innerHTML = `<div style="color: red; padding: 20px; text-align: center;">加载失败：${error.message}</div>`;
    }
  }
}

// 绑定按钮事件
function bindEvents() {
  // 复制按钮（最左边）
  document.querySelectorAll('.btn-copy').forEach((btn, index) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const prompt = window.g_prompts[index];
      if (!prompt) return;
      
      navigator.clipboard.writeText(prompt.content).then(() => {
        alert('📋 已复制，请手动粘贴 (Ctrl+V)');
      }).catch(err => alert('❌ 复制失败：' + err.message));
    };
  });
  
  // 编辑按钮
  document.querySelectorAll('.btn-edit').forEach((btn, index) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const prompt = window.g_prompts[index];
      if (!prompt) return;
      
      window.g_editingId = prompt.id;
      window.g_selectedIcon = prompt.icon || '🎭';
      
      document.getElementById('modalTitle').textContent = '✏️ 编辑角色';
      document.getElementById('promptName').value = prompt.name;
      document.getElementById('promptIcon').value = prompt.icon || '🎭';
      document.getElementById('promptContent').value = prompt.content;
      
      // 更新图标预览
      const iconPreview = document.getElementById('iconPreview');
      if (iconPreview) iconPreview.textContent = prompt.icon || '🎭';
      
      // 更新图标选择器选中状态
      document.querySelectorAll('.icon-option').forEach(opt => {
        if (opt.getAttribute('data-icon') === prompt.icon) {
          opt.classList.add('selected');
        } else {
          opt.classList.remove('selected');
        }
      });
      
      document.getElementById('promptModal').classList.add('show');
    };
  });
  
  // 删除按钮
  document.querySelectorAll('.btn-delete').forEach((btn, index) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const prompt = window.g_prompts[index];
      if (!prompt) return;
      
      if (!confirm('确定要删除这个角色吗？')) return;
      
      window.g_prompts.splice(index, 1);
      chrome.storage.local.set({ prompts: window.g_prompts })
        .then(() => {
          alert('✅ 角色已删除');
          loadPrompts();
        })
        .catch(err => alert('❌ 删除失败：' + err.message));
    };
  });
}

// HTML 转义
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 显示状态
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  if (!statusDiv) return;
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  setTimeout(() => {
    statusDiv.className = 'status';
    statusDiv.textContent = '';
  }, 3000);
}

// 主程序
document.addEventListener('DOMContentLoaded', async () => {
  console.log('popup 已加载');
  
  window.g_editingId = null;
  window.g_selectedIcon = '🎭';
  
  // 初始化图标选择器
  initIconPicker();
  
  const sidebarToggle = document.getElementById('sidebarToggle');
  const addPromptBtn = document.getElementById('addPrompt');
  const modal = document.getElementById('promptModal');
  const modalTitle = document.getElementById('modalTitle');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const saveBtn = document.getElementById('saveBtn');
  const nameInput = document.getElementById('promptName');
  const iconInput = document.getElementById('promptIcon');
  const contentInput = document.getElementById('promptContent');
  
  // 加载侧边栏开关状态
  const data = await chrome.storage.local.get(['sidebarEnabled']);
  if (sidebarToggle) {
    sidebarToggle.checked = data.sidebarEnabled !== false; // 默认开启
    
    // 监听开关变化
    sidebarToggle.addEventListener('change', async () => {
      const enabled = sidebarToggle.checked;
      await chrome.storage.local.set({ sidebarEnabled: enabled });
      
      // 通知所有标签页
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          action: enabled ? 'showSidebar' : 'hideSidebar' 
        }).catch(() => {}); // 忽略错误（非所有页面都有侧边栏）
      });
      
      console.log('侧边栏已', enabled ? '开启' : '关闭');
    });
  }
  
  // 加载角色列表
  await loadPrompts();
  
  // 添加角色按钮
  if (addPromptBtn) {
    addPromptBtn.onclick = () => {
      console.log('点击添加角色');
      window.g_editingId = null;
      window.g_selectedIcon = '🎭';
      modalTitle.textContent = '🎨 添加新角色';
      if (nameInput) nameInput.value = '';
      if (iconInput) iconInput.value = '🎭';
      if (contentInput) contentInput.value = '';
      
      // 重置图标选择
      window.g_selectedIcon = '🎭';
      document.querySelectorAll('.icon-option').forEach(o => {
        o.classList.remove('selected');
        if (o.getAttribute('data-icon') === '🎭') {
          o.classList.add('selected');
        }
      });
      const iconPreview = document.getElementById('iconPreview');
      if (iconPreview) iconPreview.textContent = '🎭';
      if (iconInput) iconInput.value = '🎭';
      
      if (modal) modal.classList.add('show');
    };
  }
  
  // 关闭模态框
  if (closeBtn) {
    closeBtn.onclick = () => {
      if (modal) modal.classList.remove('show');
    };
  }
  
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      if (modal) modal.classList.remove('show');
    };
  }
  
  // 保存按钮
  if (saveBtn) {
    saveBtn.onclick = async () => {
      console.log('点击保存');
      
      const name = nameInput ? nameInput.value.trim() : '';
      const icon = iconInput ? iconInput.value.trim() : window.g_selectedIcon;
      const content = contentInput ? contentInput.value.trim() : '';
      
      if (!name) {
        showStatus('❌ 请输入角色名称', 'error');
        return;
      }
      if (!content) {
        showStatus('❌ 请输入 Prompt 内容', 'error');
        return;
      }
      
      try {
        if (window.g_editingId) {
          console.log('更新角色:', window.g_editingId);
          const index = window.g_prompts.findIndex(p => p.id === window.g_editingId);
          if (index !== -1) {
            window.g_prompts[index] = { ...window.g_prompts[index], name, icon: icon || '🎭', content };
            showStatus('✅ 角色已更新', 'success');
          }
        } else {
          console.log('添加新角色');
          window.g_prompts.push({
            id: Date.now().toString(),
            name,
            icon: icon || '🎭',
            content,
            createdAt: new Date().toISOString()
          });
          showStatus('✅ 角色已添加', 'success');
        }
        
        console.log('保存 prompts:', window.g_prompts);
        await chrome.storage.local.set({ prompts: window.g_prompts });
        await loadPrompts();
        if (modal) modal.classList.remove('show');
      } catch (error) {
        showStatus('❌ 保存失败：' + error.message, 'error');
      }
    };
  }
});
