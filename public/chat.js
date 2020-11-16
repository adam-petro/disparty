function renderChat(newPeer) {
  console.log(newPeer);
  const chatContainer = $("#chat-container");
  const peerChatButton = $(`<button>${newPeer.peerId}</button>`);
  chatContainer.append(peerChatButton);
  peerChatButton.click(() => {
    openChatWindow(receiverId);
  });
}

//Finish the functions
function openChatWindow(receiverId) {
  const chatWindow = $(
    `<div id=${receiverId}-chat-window><input type=\"text\" id=\"${receiverId}-message-input\"/><button onclick=\"sendMessage(${
      (receiverId, myId)
    })\"></button> </div>`
  );
  $("section").append(chatWindow);
}

function sendMessage(receiverId, senderId) {
  receiver = myPeers.find((p) => {
    p.peerId === receiverId;
  });
  receiver.send("hello", senderId);
}
