document.getElementById('addMessageButton').addEventListener('click', () => {
  const messageForm = document.getElementById('messageForm');
  const addMessageButton = document.getElementById('addMessageButton');
  if (messageForm.classList.contains('hidden')) {
    messageForm.classList.remove('hidden');
    addMessageButton.textContent = 'Cancel';
  } else {
    messageForm.classList.add('hidden');
    addMessageButton.textContent = 'Add New Message';
  }
});

document.getElementById('saveMessage').addEventListener('click', () => {
  const newTitle = document.getElementById('newTitle').value;
  const newMessage = document.getElementById('newMessage').value;
  if (newTitle && newMessage) {
    chrome.storage.local.get({ messages: [] }, (result) => {
      const messages = result.messages;
      messages.push({ title: newTitle, message: newMessage });
      chrome.storage.local.set({ messages }, () => {
        document.getElementById('newTitle').value = '';
        document.getElementById('newMessage').value = '';
        document.getElementById('messageForm').classList.add('hidden');
        document.getElementById('addMessageButton').textContent = 'Add New Message';
        displayMessages();
      });
    });
  }
});

function displayMessages() {
  chrome.storage.local.get({ messages: [] }, (result) => {
    const messageList = document.getElementById('messageList');
    messageList.innerHTML = '';
    result.messages.forEach((item, index) => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="message-content">
                        <span class="message-title">${item.title}</span>
                        <span class="message-text">${item.message}</span>
                      </div>
                      <button class="copyButton" data-index="${index}" title="Copy"><i class="fas fa-copy"></i></button>
                      <button class="editButton" data-index="${index}" title="Edit"><i class="fas fa-edit"></i></button>
                      <button class="deleteButton" data-index="${index}" title="Delete"><i class="fas fa-trash"></i></button>`;
      messageList.appendChild(li);
    });

    document.querySelectorAll('.copyButton').forEach(button => {
      button.addEventListener('click', () => {
        copyMessage(button.getAttribute('data-index'));
      });
    });

    document.querySelectorAll('.editButton').forEach(button => {
      button.addEventListener('click', () => {
        editMessage(button.getAttribute('data-index'));
      });
    });

    document.querySelectorAll('.deleteButton').forEach(button => {
      button.addEventListener('click', () => {
        deleteMessage(button.getAttribute('data-index'));
      });
    });
  });
}

function copyMessage(index) {
  chrome.storage.local.get({ messages: [] }, (result) => {
    const message = result.messages[index].message;
    navigator.clipboard.writeText(message)
      .then(() => {
        // Show a brief success animation on the copy button
        const button = document.querySelector(`.copyButton[data-index="${index}"]`);
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          button.innerHTML = '<i class="fas fa-copy"></i>';
        }, 1000);
      })
      .catch(err => {
        console.error('Failed to copy message to clipboard: ', err);
      });
  });
}

function editMessage(index) {
  chrome.storage.local.get({ messages: [] }, (result) => {
    const message = result.messages[index];
    document.getElementById('newTitle').value = message.title;
    document.getElementById('newMessage').value = message.message;
    document.getElementById('messageForm').classList.remove('hidden');
    document.getElementById('addMessageButton').textContent = 'Cancel';
    deleteMessage(index);
  });
}

function deleteMessage(index) {
  chrome.storage.local.get({ messages: [] }, (result) => {
    const messages = result.messages;
    messages.splice(index, 1);
    chrome.storage.local.set({ messages }, displayMessages);
  });
}

function exportMessages() {
  chrome.storage.local.get({ messages: [] }, (result) => {
    const messages = result.messages;
    const exportData = {
      exportDate: new Date().toISOString(),
      messages: messages
    };
    
    // Create blob and download link
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    a.href = url;
    a.download = `quick-messages-backup-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  });
}

document.getElementById('exportButton').addEventListener('click', exportMessages);

displayMessages();