// Helper function to copy ROOM_ID to clipboard - for developing purposes only.
const copyButton = document.querySelector("#copy-button");
copyButton.addEventListener("click", function (event) {
  const dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = ROOM_ID;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
});

//This function displays a prompt to enter nickname if users joins via link
function displayPromptWhenNicknameNotPresent() {
  return new Promise((resolve, reject) => {
    if (sessionStorage.getItem("nickname") !== null) {
      $(".ui.modal").modal("hide");
      resolve();
    } else {
      $(".ui.modal").modal("setting", "closable", false).modal("show");
      $("#submit-nickname-button").click(() => {
        saveNickname().then(() => {
          $(".ui.modal").modal("hide");
          resolve();
        });
      });
    }
  });
}

//This functions saves nickname in to the session storage
function saveNickname() {
  return new Promise((resolve, reject) => {
    const nicknameInput = $("#nickname-input");
    if (nicknameInput.val().length === 0) {
      nicknameInput.parent().addClass(" field error");
    } else {
      sessionStorage.setItem("nickname", nicknameInput.val());
      resolve();
    }
  });
}
