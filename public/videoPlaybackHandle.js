function mountComponents() {
  //Get section
  const section = $("section");

  //Create elements
  const videoContainer = $('<div id = "video-container"></div>');
  const inputPrompt = $(
    '<input id = "video-input" type="file" accept="video/*"/>'
  );
  const videoPlayer = $('<video controls id="local-video"></video>');

  //Append Elements
  section.prepend(videoContainer);
  videoContainer.append(inputPrompt);
  videoContainer.append(videoPlayer);
}
function localFileVideoPlayer() {
  let URL = window.url || window.webkitURL;
  function displayErrorMessage() {
    //Make a prompt saying the video can not be played
  }
  function playSelectedFile(event) {
    let file = this.files[0];
    let type = file.type;
    let videoNode = document.querySelector("#local-video");
    if (videoNode.canPlayType(type) === "") {
      displayErrorMessage();
      return;
    }
    let fileURL = URL.createObjectURL(file);
    videoNode.src = fileURL;
    const addedVideoEvent = new Event("added-video");
    inputNode.dispatchEvent(addedVideoEvent);
  }
  const inputNode = document.querySelector("#video-input");
  inputNode.addEventListener("change", playSelectedFile, false);
}

function handleVideoStreaming() {
  let localVideoInput = document.querySelector("#video-input");
  localVideoInput.addEventListener("added-video", () => {
    localVideo = document.querySelector("#local-video");
    localVideo.addEventListener("loadedmetadata", async () => {
      stream = localVideo.captureStream();
      await myPeers.forEach((peer) => {
        //Replace video mediatrack
        console.log(peer["peer"].streams[1].getTracks());
        console.log(stream.getTracks());
        peer["peer"].replaceTrack(
          peer["peer"].streams[1].getTracks()[1],
          stream.getTracks()[1],
          peer["peer"].streams[1]
        );

        //Replace AudioMediatrack
        peer["peer"].replaceTrack(
          peer["peer"].streams[1].getTracks()[0],
          stream.getTracks()[0],
          peer["peer"].streams[1]
        );

        peer["peer"].send("started-streaming");
      });
      // socket.emit("added-video", ROOM_ID);
    });
  });
}

async function handleVideoPlayback() {
  await mountComponents();
  localFileVideoPlayer();
  handleVideoStreaming();
}
