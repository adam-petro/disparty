// Helper function to paste from clipboard to textfield - for developing purposes only.
const pasteButton = document.querySelector("#paste-button");
pasteButton.addEventListener("click", function (event) {
  const inputField = document.getElementById("join-form").elements["room-id"];
  navigator.clipboard.readText().then((text) => (inputField.value = text));
});

const myStorage = window.sessionStorage;
const nicknamefield = $("#nickname");
nicknamefield.change(() => {
  myStorage.setItem("nickname", nicknamefield.val());
});
