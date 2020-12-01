//Add splice functionality to rerender the chat

let myPeers = [];
function modifyPushFunction(arrayToListen, callbackFunction) {
  arrayToListen.push = function (newObject) {
    Array.prototype.push.call(arrayToListen, newObject);
    callbackFunction(arrayToListen, newObject);
  };
}

function modifySpliceFunction(arrayToListen, callbackFunction) {
  arrayToListen.splice = function (start, deleteCount) {
    callbackFunction(arrayToListen, start, deleteCount);
    Array.prototype.splice(start, deleteCount);
  };
}

modifySpliceFunction(myPeers, function (updatedArr, start, deleteCount) {
  //Remove the chatWindow
  removeChatWindow(updatedArr[start].peerId);
  removeLabelFromListOfPeers(updatedArr[start]);
});

// modifySpliceFunction(myPeers,function(updatedArr,))
modifyPushFunction(myPeers, function (updatedArr, newPeer) {
  renderChat(newPeer);
});
