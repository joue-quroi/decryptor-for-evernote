const read = file => new Promise(resolve => {
  const reader = new FileReader();

  reader.onload = e => {
    const content = e.target.result;
    resolve(content);
  };

  reader.readAsText(file, 'UTF-8');
});

// evernote
async function decrypt(b64, password, length = 128) {
  const bintxt = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const salt = bintxt.slice(4, 20);
  const iv = bintxt.slice(36, 52);
  const ciphertext = bintxt.slice(52, -32);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
  const key = await crypto.subtle.deriveKey({
    name: 'PBKDF2',
    salt,
    iterations: 50000,
    hash: 'SHA-256'
  }, keyMaterial, {
    name: 'AES-CBC',
    length
  },
  false, // Extractable: false for better security
  ['decrypt']);

  const decipher = await crypto.subtle.decrypt({
    name: 'AES-CBC',
    iv
  }, key, ciphertext);

  return new TextDecoder('utf-8').decode(decipher);
}

// encrypt
async function encrypt(text, password, hash = 'SHA-512', algorithm = 'AES-CBC', iterations = 50000, prepend = '', append = '') {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({
    name: 'PBKDF2',
    hash,
    salt,
    iterations
  }, keyMaterial, {
    name: algorithm,
    length: 256
  }, false, ['encrypt', 'decrypt']);

  const iv = crypto.getRandomValues(new Uint8Array(16));

  const encrypted = new Uint8Array(await crypto.subtle.encrypt({
    name: algorithm,
    iv
  }, key, new TextEncoder().encode(text)));


  const result = new Uint8Array(iv.byteLength + salt.byteLength + encrypted.byteLength);

  result.set(iv, 0);
  result.set(salt, iv.byteLength);
  result.set(encrypted, iv.byteLength + salt.byteLength);

  return prepend + btoa(String.fromCharCode.apply(null, result)) + append;
}

document.querySelector('form').onsubmit = async e => {
  e.submitter.value = 'Please wait...';
  e.submitter.disabled = true;
  e.preventDefault();

  const {files} = document.querySelector('input[type=file]');
  const epass = prompt('Enter your Evernote password');
  if (!epass) {
    e.submitter.value = 'Proceed';
    e.submitter.disabled = false;
    return;
  }
  const ppass = document.getElementById('encrypted-text').checked ? prompt('Enter your new password') : '';
  if (ppass === '') {
    document.getElementById('plain-text').checked = true;
  }

  try {
    let count = 0;
    for (const file of files) {
      count += 1;

      let content = await read(file);
      const matches = content.match(/<en-crypt [^>]*>([^<]*)<\/en-crypt>/g) || [];

      let m = 0;
      for (const match of matches) {
        m += 1;
        e.submitter.value = 'Working (File: ' + count + '/' + files.length + ', Match: ' + m + '/' + matches.length + ')...';

        console.log(m);

        const [att, body] = match.split('">');
        const b64 = body.split('<')[0];

        if (att.includes('cipher="AES"') === false || att.includes('length="128') === false) {
          throw Error('Unsupported Encryption: ' + att);
        }

        const decrypted = await decrypt(b64, epass);

        const next = async content => {
          if (document.getElementById('plain-text').checked) {
            return content;
          }
          else {
            return await encrypt(
              content,
              epass,
              document.getElementById('hash').value,
              document.getElementById('algorithm').value,
              document.getElementById('iterations').valueAsNumber,
              document.getElementById('prepend').value,
              document.getElementById('append').value
            );
          }
        };

        if (decrypted.startsWith('<') && document.getElementById('conversion').value === 'plain-text') {
          const div = document.createElement('div');
          div.style = `position: fixed; opacity: 0`;
          document.body.append(div);
          const p = new DOMParser();
          const d = p.parseFromString(decrypted, 'text/html');
          div.append(d.body);
          const c = div.innerText;
          div.remove();

          content = content.replaceAll(match, await next(c));
        }
        else {
          content = content.replaceAll(match, await next(decrypted));
        }
      }

      const a = document.createElement('a');
      a.download = file.name;
      a.href = URL.createObjectURL(new Blob([content, {
        type: 'application/bin'
      }]));
      a.click();
    }
  }
  catch (e) {
    alert('Error!\n\n:' + e.message || 'NA');
  }
  e.submitter.value = 'Proceed';
  e.submitter.disabled = false;
};
