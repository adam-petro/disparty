function renderChat(newPeer) {
  openChatWindow("single", newPeer);
}

//Finish the functions
function openChatWindow(type, receiver) {
  let id;
  if (type === "group") {
    id = "everyone";
    nickname = "everyone";
  } else {
    id = receiver.peerId;
    nickname = receiver.nickname;
  }
  const chatWindow = $(
    `<div class="${id} chat-window" id=${id}-chat-window>
    <div class="chat-messages" id=${id}-chat-messages>
    </div>
    <div class="chat-controls"><input type=\"text\" id=\"${id}-message-input\"/>
    </div>
    </div>`
  );
  const sendMessageButton = $(
    `<button id="${id}-send-message-button">Send message to ${nickname}</button>`
  );
  sendMessageButton.click(() => {
    if (type === "group") sendGroupMessage();
    else sendMessage(receiver);
  });
  chatWindow.append(sendMessageButton);
  $("section").append(chatWindow);
}

function sendGroupMessage() {
  const message = {
    type: "group-message",
    data: $(`#everyone-message-input`).val(),
    sender: myId,
  };

  myPeers.forEach((peer) => {
    peer["peer"].send(JSON.stringify(message));
  });

  const chatMessages = $(`#everyone-chat-messages`);
  chatMessages.append(
    $(
      `<p class="send chat-message"><b>${message.sender}</b>:${message.data}<p>`
    )
  );
}

function sendMessage(receiver) {
  const message = {
    type: "message",
    data: $(`#${receiver.peerId}-message-input`).val(),
    sender: myId,
  };
  receiver["peer"].send(JSON.stringify(message));
  const chatMessages = $(`#${receiver.peerId}-chat-messages`);
  chatMessages.append(
    $(
      `<p class="send chat-message"><b>${sessionStorage.getItem(
        "nickname"
      )}</b>:${message.data}<p>`
    )
  );
}

function receiveMessage(message) {
  let chatMessagesId;
  if (message.type === "group-message") {
    chatMessagesId = "#everyone-chat-messages";
    nickname = "everyone";
  } else {
    chatMessagesId = `#${message.sender}-chat-messages`;
    nickname = myPeers.find((peer) => {
      return peer.peerId == message.sender;
    }).nickname;
  }
  const chatMessages = $(chatMessagesId);
  chatMessages.append(
    $(`<p class="receive chat-message"><b>${nickname}</b>:${message.data}<p>`)
  );
}

function removeChatWindow(peerId) {
  $(`#${peerId}-chat-window`).remove();
}
