document.getElementById('addMessageButton').addEventListener('click', () => {
  const messageForm = document.getElementById('messageForm');
  const addMessageButton = document.getElementById('addMessageButton');
  if (messageForm.classList.contains('hidden')) {
    messageForm.classList.remove('hidden');
    addMessageButton.textContent = 'İptal';
  } else {
    messageForm.classList.add('hidden');
    addMessageButton.textContent = 'Yeni Mesaj Ekle';
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
        document.getElementById('addMessageButton').textContent = 'Yeni Mesaj Ekle';
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
                      <button class="copyButton" data-index="${index}"><i class="fas fa-copy"></i></button>
                      <button class="editButton" data-index="${index}"><i class="fas fa-edit"></i></button>
                      <button class="deleteButton" data-index="${index}"><i class="fas fa-trash"></i></button>`;
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
    navigator.clipboard.writeText(message).catch(err => {
      console.error('Mesaj panoya kopyalanamadı: ', err);
    });
  });
}

function editMessage(index) {
  chrome.storage.local.get({ messages: [] }, (result) => {
    const message = result.messages[index];
    document.getElementById('newTitle').value = message.title;
    document.getElementById('newMessage').value = message.message;
    document.getElementById('messageForm').classList.remove('hidden');
    document.getElementById('addMessageButton').textContent = 'İptal';
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

displayMessages();