function renderChat(newPeer) {
  openChatWindow(newPeer);
}

//Finish the functions
function openChatWindow(peer) {
  const chatWindow = $(
    `<div id=${peer.peerId}-chat-window><div id=${peer.peerId}-chat-messages></div><div><input type=\"text\" id=\"${peer.peerId}-message-input\"/></div></div>`
  );
  const sendMessageButton = $(
    `<button id="${peer.peerId}-send-message-button">Send message to ${peer.peerId}</button>`
  );
  sendMessageButton.click(() => {
    sendMessage(peer);
  });
  chatWindow.append(sendMessageButton);
  $("section").append(chatWindow);
}
function sendMessage(receiver) {
  const message = {
    type: "message",
    data: $(`#${receiver.peerId}-message-input`).val(),
    sender: myId,
  };
  receiver["peer"].send(JSON.stringify(message));
  const chatMessages = $(`#${receiver.peerId}-chat-messages`);
  chatMessages.append($(`<p><b>${message.sender}</b>:${message.data}<p>`));
}

function receiveMessage(message) {
  console.log("receive message called");
  const chatMessages = $(`#${message.sender}-chat-messages`);
  chatMessages.append($(`<p><b>${message.sender}</b>:${message.data}<p>`));
}

function removeChatWindow(peerId) {
  console.log("this function was once called", peerId);
  console.log(`expected chat window id: ${peerId}-chat-window`);
  $(`#${peerId}-chat-window`).remove();
}
