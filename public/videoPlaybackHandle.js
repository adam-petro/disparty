function localFileVideoPlayer() {
  let URL = window.url || window.webkitURL;
  let displayMessage = function (message, isError) {
    let element = document.querySelector("#message");
    element.innerHTML = message;
    element.className = isError ? "error" : "info";
  };
  let playSelectedFile = function (event) {
    let file = this.files[0];
    let type = file.type;
    let videoNode = document.querySelector("#local-video");
    let canPlay = videoNode.canPlayType(type);
    if (canPlay === "") canPlay = "no";
    let message = "Can play type: " + type + " => " + canPlay;
    let isError = canPlay === "no";
    displayMessage(message, isError);

    if (isError) {
      return;
    }
    let fileURL = URL.createObjectURL(file);
    videoNode.src = fileURL;
    const addedVideoEvent = new Event("added-video");
    inputNode.dispatchEvent(addedVideoEvent);
  };
  let inputNode = document.querySelector("#video-input");
  inputNode.addEventListener("change", playSelectedFile, false);
}
localFileVideoPlayer();
