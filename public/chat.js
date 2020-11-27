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

  $(`section`).append(chatWindow(id, nickname));

  const sendMessageButton = $(`#${id}-send-message-button`);
  console.log(sendMessageButton);
  sendMessageButton.on("click", () => {
    console.log("hm");
    if (type === "group") sendGroupMessage();
    else sendMessage(receiver);
  });
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
    chatMessage(message.data, sessionStorage.getItem("nickname"))
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
    chatMessage(message.data, sessionStorage.getItem("nickname"))
  );
}

function receiveMessage(message) {
  let chatMessagesId;
  if (message.type === "group-message") {
    chatMessagesId = "#everyone-chat-messages";
  } else {
    chatMessagesId = `#${message.sender}-chat-messages`;
  }
  nickname = myPeers.find((peer) => {
    return peer.peerId == message.sender;
  }).nickname;
  const chatMessages = $(chatMessagesId);
  chatMessages.append(chatMessage(message.data, nickname));
}

function removeChatWindow(peerId) {
  $(`#${peerId}-chat-window`).remove();
}
