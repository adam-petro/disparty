function renderChat(newPeer) {
  createChatWindow("single", newPeer);
}

function renderLabelListOfPeers(id, nickname) {
  const newLabel = peerLabel(id, nickname);
  $("#label-container").prepend(newLabel);
  newLabel.on("click", () => toggleChatWindow(id));
}

function removeLabelFromListOfPeers(peerToRemove) {
  $(`#${peerToRemove.peerId}-label`).remove();
}

function openChatWindow(chatWindowId) {
  //Close all other chat windows since only one can be open at a time
  $(`.ui.card.chat-window`).addClass("hidden-chat");

  $(`#${chatWindowId}-chat-window`).removeClass("hidden-chat");
}

function toggleChatWindow(chatWindowId) {
  const chatWindow = $(`#${chatWindowId}-chat-window`);
  if (chatWindow.hasClass("hidden-chat")) {
    openChatWindow(chatWindowId);
  } else if (!chatWindow.hasClass("hidden-chat")) {
    closeChatWindow(chatWindowId);
  }
}

function closeChatWindow(chatWindowId) {
  $(`#${chatWindowId}-chat-window`).addClass("hidden-chat");
}

function createChatWindow(type, receiver) {
  let id;
  if (type === "group") {
    id = "everyone";
    nickname = "everyone";
  } else {
    id = receiver.peerId;
    nickname = receiver.nickname;
  }
  renderLabelListOfPeers(id, nickname);
  const newChatWindow = chatWindow(id, nickname);
  $(`section`).append(newChatWindow);

  const sendMessageButton = $(`#${id}-send-message-button`);
  sendMessageButton.on("click", () => {
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
    chatMessagesId = "everyone";
  } else {
    chatMessagesId = message.sender;
  }
  nickname = myPeers.find((peer) => {
    return peer.peerId == message.sender;
  }).nickname;
  const chatMessages = $(`#${chatMessagesId}-chat-messages`);
  chatMessages.append(chatMessage(message.data, nickname));
  openChatWindow(chatMessagesId);
}

function logPeerId(peerid) {
  console.log(peerid);
}
function removeChatWindow(peerId) {
  $(`#${peerId}-chat-window`).remove();
}
