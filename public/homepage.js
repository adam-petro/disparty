// Helper function to paste from clipboard to textfield - for developing purposes only.
const pasteButton = document.querySelector("#paste-button");
pasteButton.addEventListener("click", function (event) {
  const inputField = document.getElementById("join-form").elements["room-id"];
  navigator.clipboard.readText().then((text) => (inputField.value = text));
});

//Function to save the nickname to session storage.
const myStorage = window.sessionStorage;
const nicknamefield = $("#nickname");
nicknamefield.change(() => {
  myStorage.setItem("nickname", nicknamefield.val());
});

//Function to set the field class to invalid and change the styling of field if invalid
function validateField(field) {
  field.parentElement.className =
    field.parentElement.className + " field error";
}

//Helper functions. If user clicks 'join room', room id should be a required field. otherwise it shouldn't.
function makeRoomIdRequired() {
  $("#room-id").attr("required", "");
}

function makeRoomIdNotRequired() {
  $("#room-id").removeAttr("required");
}
