document.addEventListener('DOMContentLoaded', () => {
  const noteInput = document.getElementById('noteInput');
  const notesList = document.getElementById('notesList');
  const searchInput = document.getElementById('searchInput');
  const exportBtn = document.getElementById('exportBtn');

  // 导出选中的笔记
  exportBtn.addEventListener('click', () => {
    chrome.storage.sync.get(['notes'], (result) => {
      const notes = result.notes || [];
      const selectedNotes = [];
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const noteId = parseInt(checkbox.dataset.id);
          const note = notes.find(n => n.id === noteId);
          if (note) selectedNotes.push(note);
        }
      });

      if (selectedNotes.length === 0) {
        alert('请先选择要导出的笔记！');
        return;
      }

      const blob = new Blob([JSON.stringify(selectedNotes, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });

  // 加载保存的笔记
  loadNotes();

  // 添加键盘快捷键监听
  document.addEventListener('keydown', (e) => {
    // 检测 Command+N 快捷键
    if (e.metaKey && e.key === 'n') {
      e.preventDefault(); // 阻止默认行为
      addNote();
    }
  });

  // 搜索笔记
  searchInput.addEventListener('input', filterNotes);

  function addNote() {
    console.log('addNote函数被调用');
    const text = noteInput.value.trim();
    if (!text) {
      console.log('笔记内容为空');
      return;
    }

    // 获取当前标签页URL
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0].url;
      const noteText = text.split('\n')[0] + (text.split('\n').length > 1 ? '...' : '');
      const noteWithUrl = `${currentUrl}\n\n${noteText}`;

      const note = {
        id: Date.now(),
        text: noteWithUrl,
        date: new Date().toISOString()
      };

      console.log('准备保存笔记:', note);
      chrome.storage.sync.get(['notes'], (result) => {
        console.log('获取现有笔记:', result);
        const notes = result.notes || [];
        notes.unshift(note);
        chrome.storage.sync.set({ notes }, () => {
          if (chrome.runtime.lastError) {
            console.error('保存笔记时出错:', chrome.runtime.lastError);
            return;
          }
          console.log('笔记保存成功');
          // 清空笔记列表
          notesList.innerHTML = '';
          // 渲染所有笔记
          notes.forEach(renderNote);
          noteInput.value = '';
        });
      });
    });
  }

  function loadNotes() {
    chrome.storage.sync.get('notes', (result) => {
      if (chrome.runtime.lastError) {
        console.error('加载笔记时出错:', chrome.runtime.lastError);
        return;
      }
      const notes = result.notes || [];
      // 清空笔记列表
      notesList.innerHTML = '';
      // 只显示最新的两条笔记
      notes.slice(0, 2).forEach(renderNote);
    });
  }

  function renderNote(note) {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.dataset.id = note.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.id = note.id;
    checkbox.style.marginRight = '8px';

    const noteContent = note.text.split('\n\n');
    const url = noteContent[0] || '';
    const text = noteContent[1] || '';

    const urlDiv = document.createElement('div');
    urlDiv.className = 'note-url';
    const urlLink = document.createElement('a');
    urlLink.href = url;
    urlLink.textContent = url;
    urlLink.target = '_blank';
    urlLink.style.cssText = `
      display: block;
      word-break: break-all;
      margin-bottom: 8px;
      color: #0066cc;
      font-size: 12px;
      line-height: 1.4;
      text-decoration: none;
    `;
    urlLink.onmouseover = () => {
      urlLink.style.textDecoration = 'underline';
    };
    urlLink.onmouseout = () => {
      urlLink.style.textDecoration = 'none';
    };
    urlDiv.appendChild(urlLink);

    const textDiv = document.createElement('div');
    textDiv.className = 'note-text';
    textDiv.style.cssText = `
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      color: #333;
      font-size: 14px;
      line-height: 1.4;
      padding: 4px 0;
    `;
    textDiv.textContent = text;

    const actions = document.createElement('div');
    actions.className = 'note-actions';
    actions.style.marginTop = '8px';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-note';
    deleteBtn.innerHTML = '✖';
    deleteBtn.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: #ff4444;
      color: white;
      border: none;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin-left: 8px;
      transition: background-color 0.2s ease;
    `;
    deleteBtn.onmouseover = () => {
      deleteBtn.style.backgroundColor = '#ff6666';
    };
    deleteBtn.onmouseout = () => {
      deleteBtn.style.backgroundColor = '#ff4444';
    };
    deleteBtn.onclick = () => deleteNote(note.id);

    actions.appendChild(deleteBtn);
    li.appendChild(checkbox);
    li.appendChild(urlDiv);
    li.appendChild(textDiv);
    li.appendChild(actions);
    notesList.insertBefore(li, notesList.firstChild);
  }

  function deleteNote(id) {
    chrome.storage.sync.get(['notes'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('删除笔记时出错:', chrome.runtime.lastError);
        return;
      }
      const notes = result.notes || [];
      const updatedNotes = notes.filter(note => note.id !== id);
      chrome.storage.sync.set({ notes: updatedNotes }, () => {
        if (chrome.runtime.lastError) {
          console.error('更新笔记列表时出错:', chrome.runtime.lastError);
          return;
        }
        const noteElement = document.querySelector(`li[data-id="${id}"]`);
        if (noteElement) noteElement.remove();
      });
    });
  }

  function filterNotes() {
    const searchText = searchInput.value.toLowerCase();
    const noteItems = notesList.getElementsByClassName('note-item');

    Array.from(noteItems).forEach(item => {
      const noteText = item.querySelector('.note-text').textContent.toLowerCase();
      item.style.display = noteText.includes(searchText) ? '' : 'none';
    });
  }
});