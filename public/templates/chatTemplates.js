function chatWindow(id, nickname) {
  return $(`
  <div class="ui card chat-window hidden-chat" id=${id}-chat-window>
  <div class="content"><div class="header">${nickname}</div></div>
  <div class="content">
    <div class="ui feed chat-feed" id=${id}-chat-messages>
    </div>
  </div>
  <div class="extra content">
    <div class="ui large transparent action input message-input">
      <input type="text" id=\"${id}-message-input\" placeholder="Send Message..." />
      <button id="${id}-send-message-button" class="ui icon button"><i class="paper plane outline icon"></i></button>
    </div>
  </div>
</div>
`);
}

function chatMessage(message, sender) {
  return $(`
    <div class="event">
        <div class="content">
          <span class="ui blue text"><b>${sender}</b></span>
          ${message}
        </div>
      </div>`);
}

function peerLabel(id, nickname) {
  return $(`<a class="ui label" id=${id}-label>
        <i class="user circle icon"></i>${nickname}
      </a>`);
}
