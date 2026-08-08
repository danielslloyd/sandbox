// Thin websocket wrapper. Written against the same message shapes whether the players
// on the other end are humans or scripted bots, so Track A and Track B join with a swap
// rather than a rewrite.

export function connect({ onMessage, onOpen, onClose }) {
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${scheme}://${location.host}`);
  let open = false;

  ws.addEventListener('open', () => { open = true; onOpen && onOpen(); });
  ws.addEventListener('close', () => { open = false; onClose && onClose(); });
  ws.addEventListener('message', (e) => {
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }
    onMessage(msg);
  });

  return {
    send(msg) { if (open) ws.send(JSON.stringify(msg)); },
    close() { ws.close(); },
    get open() { return open; },
  };
}
