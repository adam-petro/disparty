//Add splice functionality to rerender the chat

let myPeers = [];
function attachListeningFunction(arrayToListen, callbackFunction) {
  arrayToListen.push = function (newObject) {
    Array.prototype.push.call(arrayToListen, newObject);
    callbackFunction(arrayToListen, newObject);
  };
}
attachListeningFunction(myPeers, function (updatedArr, newPeer) {
  renderChat(newPeer);
});
