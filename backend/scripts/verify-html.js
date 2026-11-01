const http = require('http');

const pages = [
  'index.html', 'news.html', 'gallery.html', 'faculty.html',
  'achievements.html', 'student-life.html', 'parents.html',
  'alumni.html', 'academics.html', 'admission.html', 'contact.html',
];

let done = 0;
pages.forEach(p => {
  http.get('http://localhost:3000/' + p, (r) => {
    let b = '';
    r.on('data', c => b += c);
    r.on('end', () => {
      const hasApi = b.includes('js/api.js');
      const hasCL = b.includes('js/content-loader.js');
      const hasAdm = b.includes('js/admission.js');
      console.log(
        (hasApi ? '✅' : '❌') + ' api.js | ' +
        (hasCL ? '✅' : '⬜') + ' content-loader | ' +
        (hasAdm ? '✅' : '⬜') + ' admission.js → ' + p
      );
      done++;
      if (done === pages.length) console.log('\n✅ All ' + done + ' pages verified');
    });
  }).on('error', e => console.log('ERR ' + p + ': ' + e.message));
});
