var peer1 = new SimplePeer({ initiator: location.hash === "#init" });

peer1.on("signal", (data) => {
  // when peer1 has signaling data, give it to peer2 somehow
  $("#my-id").val(JSON.stringify(data));
});
peer1.on("connect", () => {
  // wait for 'connect' event before using the data channel
  peer1.send("hey peer2, how is it going?");
});
