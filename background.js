// AI Prompt Manager - Background Service Worker

// 插件安装时 - 添加示例角色
chrome.runtime.onInstalled.addListener((details) => {
  console.log('AI Prompt Manager 已安装', details);
  
  // 初始化示例角色
  chrome.storage.local.set({
    prompts: [
      {
        id: '1',
        name: '代码专家',
        icon: '💻',
        content: `你是一个资深的软件工程师，擅长：
- 代码审查和优化
- 架构设计
- 调试和解决问题
- 最佳实践建议

请用专业的态度回答我的编程问题。`,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: '写作助手',
        icon: '📝',
        content: `你是一个专业的编辑和写作助手，擅长：
- 文章润色和修改
- 语法和拼写检查
- 文风调整
- 结构优化

请帮我改进文章的质量。`,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: '翻译专家',
        icon: '🌐',
        content: `你是一个专业的翻译，擅长：
- 中英文互译
- 保持原文风格
- 专业术语准确
- 流畅自然的表达

请帮我翻译以下内容，保持准确和流畅。`,
        createdAt: new Date().toISOString()
      }
    ]
  });
});

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPrompts') {
    chrome.storage.local.get(['prompts']).then(data => {
      sendResponse({ prompts: data.prompts || [] });
    });
    return true;
  }
  
  if (request.action === 'savePrompt') {
    chrome.storage.local.get(['prompts']).then(data => {
      let prompts = data.prompts || [];
      
      if (request.prompt.id) {
        // 更新
        const index = prompts.findIndex(p => p.id === request.prompt.id);
        if (index !== -1) {
          prompts[index] = request.prompt;
        }
      } else {
        // 新增
        request.prompt.id = Date.now().toString();
        request.prompt.createdAt = new Date().toISOString();
        prompts.push(request.prompt);
      }
      
      chrome.storage.local.set({ prompts }).then(() => {
        sendResponse({ success: true, prompts });
      });
    });
    return true;
  }
  
  if (request.action === 'deletePrompt') {
    chrome.storage.local.get(['prompts']).then(data => {
      let prompts = data.prompts || [];
      prompts = prompts.filter(p => p.id !== request.id);
      chrome.storage.local.set({ prompts }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

// 定期备份（可选）
setInterval(() => {
  chrome.storage.local.get(['prompts']).then(data => {
    console.log('Prompt 数量:', data.prompts ? data.prompts.length : 0);
  });
}, 300000); // 每 5 分钟
