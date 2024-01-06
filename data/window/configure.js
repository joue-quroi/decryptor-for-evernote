document.getElementById('obsidian-encrypt').onclick = () => {
  document.getElementById('conversion').value = 'plain-text';
  document.getElementById('encrypted-text').checked = true;
  document.getElementById('hash').value = 'SHA-512';
  document.getElementById('algorithm').value = 'AES-GCM';
  document.getElementById('iterations').value = 21e4;
  document.getElementById('prepend').value = '🔐β 💡hint💡';
  document.getElementById('append').value = ' 🔐';
};
document.getElementById('obsidian-inline-encrypter').onclick = () => {
  document.getElementById('conversion').value = 'plain-text';
  document.getElementById('encrypted-text').checked = true;
  document.getElementById('hash').value = 'SHA-512';
  document.getElementById('algorithm').value = 'AES-GCM';
  document.getElementById('iterations').value = 262144;
  document.getElementById('prepend').value = '<code>secret ';
  document.getElementById('append').value = '</code>';
};
