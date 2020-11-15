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
