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

async function handleVideoStreaming() {
  let localVideoInput = document.querySelector("#video-input");

  //On video added, run following
  localVideoInput.addEventListener("added-video", async () => {
    const localVideo = getLocalVideo();
    //On loaded metadata of the video
    function addAndNotify() {
      //Capture the videostream
      const stream = localVideo.captureStream();
      //For each of my peers, replace their tracks and notify them that I started stream
      myPeers.forEach((peer) => {
        replaceStreamTracks(peer["peer"], stream);
        const message = {
          type: "notification",
          data: "started-streaming",
          sender: socket.id,
        };
        peer["peer"].send(JSON.stringify(message));
      });
      //Set state variable currentlyStreaming to true
      currentlyStreaming = true;
    }
    localVideo.addEventListener("loadedmetadata", addAndNotify);
    localVideo.addEventListener("pause", () => {
      localVideo.removeEventListener("play", addAndNotify);
    });
    localVideo.addEventListener("ended", () => {
      localVideo.addEventListener("play", addAndNotify);
    });
  });
}

async function handleVideoPlayback() {
  await mountComponents();
  localFileVideoPlayer();
  handleVideoStreaming();
}

function getLocalVideo() {
  localVideo = document.querySelector("#local-video");
  return localVideo;
}

function replaceStreamTracks(peer, stream) {
  //Replace VideoMediaTrack
  peer.replaceTrack(
    peer.streams[1].getTracks()[1],
    stream.getTracks()[1],
    peer.streams[1]
  );

  //Replace AudioMediatrack
  peer.replaceTrack(
    peer.streams[1].getTracks()[0],
    stream.getTracks()[0],
    peer.streams[1]
  );
}
