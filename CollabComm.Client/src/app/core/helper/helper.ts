export function isJson(str: string) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

export function isNumber(value?: string | number): boolean {
  return ((value != null) &&
    (value !== '') &&
    !isNaN(Number(value.toString())));
}

export function isRealNumber(value?: string | number): boolean {
  return (!!value && (value !== '') && !isNaN(Number(value.toString())));
}

export function isRealPositiveNumber(value?: string | number): boolean {
  if (!(!!value && (value !== ''))) {
    return false;
  }
  const q = Number(value.toString());
  if (!isNaN(q) && q > 0) {
    return true;
  }
  return false;
}

export function humanFileSize(bytes: number, si: boolean = false, dp: number = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


  return bytes.toFixed(dp) + ' ' + units[u];
}

export function formatraw(date: string, format: string, utc: boolean) {

  const raw = new Date(date.split(' ').join('T'));

  let res = format.slice();

  const MMMM = ['\x00', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MMM = ['\x01', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dddd = ['\x02', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const ddd = ['\x03', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function ii(i: any, len: any | undefined) {
    let s1 = i + '';
    len = len || 2;
    while (s1.length < len) {
      s1 = '0' + s1;
    }
    return s1;
  }

  const y = utc ? raw.getUTCFullYear() : raw.getFullYear();
  res = res.replace(/(^|[^\\])yyyy+/g, '$1' + y);
  res = res.replace(/(^|[^\\])yy/g, '$1' + y.toString().substr(2, 2));
  res = res.replace(/(^|[^\\])y/g, '$1' + y);

  const M = (utc ? raw.getUTCMonth() : raw.getMonth()) + 1;
  res = res.replace(/(^|[^\\])MMMM+/g, '$1' + MMMM[0]);
  res = res.replace(/(^|[^\\])MMM/g, '$1' + MMM[0]);
  res = res.replace(/(^|[^\\])MM/g, '$1' + ii(M, undefined));
  res = res.replace(/(^|[^\\])M/g, '$1' + M);

  const d = utc ? raw.getUTCDate() : raw.getDate();
  res = res.replace(/(^|[^\\])dddd+/g, '$1' + dddd[0]);
  res = res.replace(/(^|[^\\])ddd/g, '$1' + ddd[0]);
  res = res.replace(/(^|[^\\])dd/g, '$1' + ii(d, undefined));
  res = res.replace(/(^|[^\\])d/g, '$1' + d);

  const H = utc ? raw.getUTCHours() : raw.getHours();
  res = res.replace(/(^|[^\\])HH+/g, '$1' + ii(H, undefined));
  res = res.replace(/(^|[^\\])H/g, '$1' + H);

  const h = H > 12 ? H - 12 : H === 0 ? 12 : H;
  res = res.replace(/(^|[^\\])hh+/g, '$1' + ii(h, undefined));
  res = res.replace(/(^|[^\\])h/g, '$1' + h);

  const m = utc ? raw.getUTCMinutes() : raw.getMinutes();
  res = res.replace(/(^|[^\\])mm+/g, '$1' + ii(m, undefined));
  res = res.replace(/(^|[^\\])m/g, '$1' + m);

  const s = utc ? raw.getUTCSeconds() : raw.getSeconds();
  res = res.replace(/(^|[^\\])ss+/g, '$1' + ii(s, undefined));
  res = res.replace(/(^|[^\\])s/g, '$1' + s);

  let f = utc ? raw.getUTCMilliseconds() : raw.getMilliseconds();
  res = res.replace(/(^|[^\\])fff+/g, '$1' + ii(f, 3));
  f = Math.round(f / 10);
  res = res.replace(/(^|[^\\])ff/g, '$1' + ii(f, undefined));
  f = Math.round(f / 10);
  res = res.replace(/(^|[^\\])f/g, '$1' + f);

  const T = H < 12 ? 'AM' : 'PM';
  res = res.replace(/(^|[^\\]){TT}/g, '$1' + T);
  res = res.replace(/(^|[^\\]){T}/g, '$1' + T.charAt(0));

  const t = T.toLowerCase();
  res = res.replace(/(^|[^\\]){tt}/g, '$1' + t);
  res = res.replace(/(^|[^\\]){t}/g, '$1' + t.charAt(0));

  let tz = -raw.getTimezoneOffset();
  let K = utc || !tz ? 'Z' : tz > 0 ? '+' : '-';
  if (!utc) {
    tz = Math.abs(tz);
    const tzHrs = Math.floor(tz / 60);
    const tzMin = tz % 60;
    K += ii(tzHrs, undefined) + ':' + ii(tzMin, undefined);
  }

  res = res.replace(/(^|[^\\])K/g, '$1' + K);

  const day = (utc ? raw.getUTCDay() : raw.getDay()) + 1;
  res = res.replace(new RegExp(dddd[0], 'g'), dddd[day]);
  res = res.replace(new RegExp(ddd[0], 'g'), ddd[day]);

  res = res.replace(new RegExp(MMMM[0], 'g'), MMMM[M]);
  res = res.replace(new RegExp(MMM[0], 'g'), MMM[M]);

  res = res.replace(/\\(.)/g, '$1');

  return res;
}
